import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/better-auth";
import {
  ingestDocument,
  listDocuments,
  deleteDocument,
} from "@/lib/knowledge/store";

export const runtime = "nodejs";

/**
 * GET /api/knowledge?organizationId=...
 * List documents for an organization.
 *
 * POST /api/knowledge
 * Body: { organizationId, title, content, source?, mimeType? }
 * Ingest a text document.
 *
 * DELETE /api/knowledge?organizationId=...&documentId=...
 */
export async function GET(req: NextRequest) {
  const organizationId = req.nextUrl.searchParams.get("organizationId");
  if (!organizationId) {
    return Response.json({ error: "organizationId required" }, { status: 400 });
  }

  const docs = await listDocuments(organizationId);
  return Response.json({ documents: docs });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    // Demo mode allows unauthenticated ingest
    void session;

    const body = await req.json();
    const { organizationId, title, content, source, mimeType, metadata } = body;

    if (!organizationId || !title || !content) {
      return Response.json(
        { error: "organizationId, title, and content are required" },
        { status: 400 }
      );
    }

    const doc = await ingestDocument({
      organizationId,
      title,
      content,
      source,
      mimeType,
      metadata,
    });

    return Response.json({ document: doc });
  } catch (err) {
    console.error("[knowledge POST]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Ingest failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const organizationId = req.nextUrl.searchParams.get("organizationId");
  const documentId = req.nextUrl.searchParams.get("documentId");

  if (!organizationId || !documentId) {
    return Response.json(
      { error: "organizationId and documentId required" },
      { status: 400 }
    );
  }

  await deleteDocument(organizationId, documentId);
  return Response.json({ ok: true });
}
