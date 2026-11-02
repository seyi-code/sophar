import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, chunks, type Citation } from "@/lib/db/schema";
import { generateId } from "@/lib/utils/id";

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 120;
const TOP_K = 8;

function splitText(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];

  const paragraphs = cleaned.split(/\n{2,}/);
  const result: string[] = [];
  let current = "";

  for (const p of paragraphs) {
    if ((current + "\n\n" + p).length > size && current) {
      result.push(current.trim());
      const words = current.split(/\s+/);
      current = words.slice(-Math.floor(overlap / 5)).join(" ") + "\n\n" + p;
    } else {
      current = current ? current + "\n\n" + p : p;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

async function embed(texts: string[]): Promise<number[][]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return texts.map((t) => {
      const vec = new Array(1536).fill(0);
      for (let i = 0; i < t.length; i++) {
        vec[i % 1536] += t.charCodeAt(i) / 255;
      }
      const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
      return vec.map((v) => v / norm);
    });
  }

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
      input: texts,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Embedding failed: ${res.status} ${err}`);
  }

  const json = (await res.json()) as {
    data: Array<{ embedding: number[]; index: number }>;
  };
  return json.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

export type IngestInput = {
  organizationId: string;
  title: string;
  content: string;
  source?: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
};

export async function ingestDocument(input: IngestInput) {
  const [doc] = await db
    .insert(documents)
    .values({
      organizationId: input.organizationId,
      title: input.title,
      source: input.source,
      mimeType: input.mimeType || "text/plain",
      status: "processing",
      metadata: input.metadata || {},
    })
    .returning();

  try {
    const pieces = splitText(input.content);
    if (pieces.length === 0) {
      await db
        .update(documents)
        .set({ status: "ready", updatedAt: new Date() })
        .where(eq(documents.id, doc.id));
      return doc;
    }

    const embeddings = await embed(pieces);

    const rows = pieces.map((content, i) => ({
      documentId: doc.id,
      organizationId: input.organizationId,
      content,
      chunkIndex: i,
      tokenCount: Math.ceil(content.length / 4),
      embedding: embeddings[i],
      metadata: { title: input.title, source: input.source },
    }));

    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      await db.insert(chunks).values(rows.slice(i, i + batchSize));
    }

    await db
      .update(documents)
      .set({ status: "ready", updatedAt: new Date() })
      .where(eq(documents.id, doc.id));

    return doc;
  } catch (err) {
    await db
      .update(documents)
      .set({
        status: "failed",
        metadata: {
          ...(input.metadata || {}),
          error: err instanceof Error ? err.message : String(err),
        },
        updatedAt: new Date(),
      })
      .where(eq(documents.id, doc.id));
    throw err;
  }
}

export async function retrieve(
  organizationId: string,
  query: string,
  topK = TOP_K
): Promise<Citation[]> {
  const [queryEmbedding] = await embed([query]);

  try {
    const results = await db.execute(sql`
      SELECT
        c.id,
        c.content,
        c.metadata,
        c.document_id,
        d.title,
        d.source,
        1 - (c.embedding <=> ${JSON.stringify(queryEmbedding)}::vector) AS score
      FROM chunks c
      JOIN documents d ON d.id = c.document_id
      WHERE c.organization_id = ${organizationId}
        AND d.status = 'ready'
      ORDER BY c.embedding <=> ${JSON.stringify(queryEmbedding)}::vector
      LIMIT ${topK}
    `);

    const rows = (results as unknown as { rows?: unknown[] }).rows ?? (results as unknown[]);
    return (rows as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      title: String(r.title || "Untitled"),
      snippet: String(r.content).slice(0, 400),
      source: r.source ? String(r.source) : undefined,
      documentId: String(r.document_id),
      score: typeof r.score === "number" ? r.score : undefined,
    }));
  } catch {
    const fallback = await db
      .select({
        id: chunks.id,
        content: chunks.content,
        documentId: chunks.documentId,
        title: documents.title,
        source: documents.source,
      })
      .from(chunks)
      .innerJoin(documents, eq(chunks.documentId, documents.id))
      .where(
        and(
          eq(chunks.organizationId, organizationId),
          eq(documents.status, "ready"),
          sql`${chunks.content} ILIKE ${"%" + query.slice(0, 80) + "%"}`
        )
      )
      .orderBy(desc(chunks.createdAt))
      .limit(topK);

    return fallback.map((r) => ({
      id: r.id,
      title: r.title,
      snippet: r.content.slice(0, 400),
      source: r.source || undefined,
      documentId: r.documentId,
    }));
  }
}

export async function listDocuments(organizationId: string) {
  return db
    .select()
    .from(documents)
    .where(eq(documents.organizationId, organizationId))
    .orderBy(desc(documents.createdAt));
}

export async function deleteDocument(organizationId: string, documentId: string) {
  await db
    .delete(documents)
    .where(
      and(eq(documents.id, documentId), eq(documents.organizationId, organizationId))
    );
}
