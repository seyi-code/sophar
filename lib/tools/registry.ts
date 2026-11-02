import { z } from "zod";
import { retrieve } from "@/lib/knowledge/store";
import type { Citation } from "@/lib/db/schema";

export type ToolContext = {
  organizationId: string;
  userId: string;
  chatId?: string;
};

export type ToolResult = {
  content: string;
  citations?: Citation[];
  data?: unknown;
};

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: z.ZodObject<z.ZodRawShape>;
  execute: (args: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult>;
};

const knowledgeSearch: ToolDefinition = {
  name: "knowledge_search",
  description:
    "Search the organization's private knowledge base for relevant documents and passages. Always prefer this before answering from general knowledge when the question may relate to internal policies, processes, or company data.",
  parameters: z.object({
    query: z.string().describe("Semantic search query"),
    top_k: z.number().optional().describe("Number of passages to return (default 6)"),
  }),
  async execute(args, ctx) {
    const query = String(args.query || "");
    const topK = typeof args.top_k === "number" ? args.top_k : 6;
    const citations = await retrieve(ctx.organizationId, query, topK);
    if (citations.length === 0) {
      return {
        content: "No relevant passages found in the knowledge base for this query.",
        citations: [],
      };
    }
    const content = citations
      .map(
        (c, i) =>
          `[${i + 1}] ${c.title}${c.source ? ` (${c.source})` : ""}\n${c.snippet}`
      )
      .join("\n\n");
    return { content, citations };
  },
};

const webSearch: ToolDefinition = {
  name: "web_search",
  description:
    "Search the public web for recent or external information. Use only when the knowledge base is insufficient and the user needs external facts.",
  parameters: z.object({
    query: z.string().describe("Search query"),
    max_results: z.number().optional().describe("Max results (default 5)"),
  }),
  async execute(args) {
    const query = String(args.query || "");
    const maxResults = typeof args.max_results === "number" ? args.max_results : 5;
    const tavilyKey = process.env.TAVILY_API_KEY;
    const serperKey = process.env.SERPER_API_KEY;

    if (tavilyKey) {
      try {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query,
            search_depth: "basic",
            max_results: maxResults,
            include_answer: false,
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          return { content: `Tavily search failed: ${res.status} ${err}` };
        }
        const json = (await res.json()) as {
          results?: Array<{ title?: string; url?: string; content?: string }>;
        };
        const results = json.results || [];
        if (!results.length) {
          return { content: `No web results for "${query}".`, citations: [] };
        }
        const citations: Citation[] = results.map((r, i) => ({
          id: `web-tavily-${i}`,
          title: r.title || "Web result",
          snippet: (r.content || "").slice(0, 400),
          source: r.url,
        }));
        const content = citations
          .map((c, i) => `[${i + 1}] ${c.title}\n${c.source}\n${c.snippet}`)
          .join("\n\n");
        return { content, citations };
      } catch (err) {
        return {
          content: `Tavily error: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    }

    if (serperKey) {
      try {
        const res = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": serperKey,
          },
          body: JSON.stringify({ q: query, num: maxResults }),
        });
        if (!res.ok) {
          const err = await res.text();
          return { content: `Serper search failed: ${res.status} ${err}` };
        }
        const json = (await res.json()) as {
          organic?: Array<{ title?: string; link?: string; snippet?: string }>;
        };
        const results = json.organic || [];
        if (!results.length) {
          return { content: `No web results for "${query}".`, citations: [] };
        }
        const citations: Citation[] = results.map((r, i) => ({
          id: `web-serper-${i}`,
          title: r.title || "Web result",
          snippet: (r.snippet || "").slice(0, 400),
          source: r.link,
        }));
        const content = citations
          .map((c, i) => `[${i + 1}] ${c.title}\n${c.source}\n${c.snippet}`)
          .join("\n\n");
        return { content, citations };
      } catch (err) {
        return {
          content: `Serper error: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    }

    return {
      content: `Web search for "${query}" is not configured. Set TAVILY_API_KEY or SERPER_API_KEY to enable live results.`,
      citations: [],
    };
  },
};

const codeInterpreter: ToolDefinition = {
  name: "code_interpreter",
  description:
    "Execute Python code in a secure sandbox. Use for calculations, data analysis, chart data generation, or transforming structured content.",
  parameters: z.object({
    code: z.string().describe("Python code to execute"),
  }),
  async execute(args) {
    const code = String(args.code || "");
    const e2bKey = process.env.E2B_API_KEY;

    if (e2bKey) {
      try {
        const { Sandbox } = await import("@e2b/code-interpreter");
        const sandbox = await Sandbox.create({ apiKey: e2bKey });
        const execution = await sandbox.runCode(code);
        await sandbox.kill();
        const logs = [
          ...(execution.logs?.stdout || []),
          ...(execution.logs?.stderr || []),
        ].join("\n");
        const result =
          execution.results?.map((r: { text?: string }) => r.text || "").join("\n") ||
          "";
        return {
          content: [logs, result].filter(Boolean).join("\n").trim() || "(no output)",
          data: { logs, results: execution.results },
        };
      } catch (err) {
        return {
          content: `E2B execution failed: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    }

    return {
      content: `[Code interpreter stub — set E2B_API_KEY for real execution]\n\nCode received:\n\`\`\`python\n${code.slice(0, 500)}${code.length > 500 ? "\n..." : ""}\n\`\`\`\n\nNo execution performed.`,
    };
  },
};

const registry = new Map<string, ToolDefinition>();

function ensureDefaults() {
  if (registry.size === 0) {
    for (const t of [knowledgeSearch, webSearch, codeInterpreter]) {
      registry.set(t.name, t);
    }
  }
}

export function registerTool(tool: ToolDefinition) {
  registry.set(tool.name, tool);
}

export function getTool(name: string): ToolDefinition | undefined {
  ensureDefaults();
  return registry.get(name);
}

export function listTools(): ToolDefinition[] {
  ensureDefaults();
  return Array.from(registry.values());
}

export function getToolsForAI(): Array<{
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}> {
  return listTools().map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: zodToJsonSchema(t.parameters),
    },
  }));
}

function zodToJsonSchema(schema: z.ZodObject<z.ZodRawShape>): Record<string, unknown> {
  const shape = schema.shape;
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    const zodVal = value as z.ZodTypeAny;
    const isOptional = zodVal.isOptional?.() ?? false;
    const inner = isOptional ? (zodVal as z.ZodOptional<z.ZodTypeAny>)._def.innerType : zodVal;
    const typeName = inner._def?.typeName as string | undefined;

    let type = "string";
    if (typeName === "ZodNumber") type = "number";
    if (typeName === "ZodBoolean") type = "boolean";
    if (typeName === "ZodArray") type = "array";

    properties[key] = {
      type,
      description: inner.description || undefined,
    };
    if (!isOptional) required.push(key);
  }

  return {
    type: "object",
    properties,
    required: required.length ? required : undefined,
  };
}

export async function runTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolResult> {
  const tool = getTool(name);
  if (!tool) {
    return { content: `Unknown tool: ${name}` };
  }
  try {
    const parsed = tool.parameters.safeParse(args);
    if (!parsed.success) {
      return {
        content: `Invalid arguments for ${name}: ${parsed.error.message}`,
      };
    }
    return await tool.execute(parsed.data, ctx);
  } catch (err) {
    return {
      content: `Tool ${name} failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
