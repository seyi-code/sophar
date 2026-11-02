import { streamText, generateText, type CoreMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import {
  getToolsForAI,
  runTool,
  type ToolContext,
} from "@/lib/tools/registry";
import {
  ENTERPRISE_RESEARCHER_PROMPT,
  ENTERPRISE_CRITIC_PROMPT,
  ENTERPRISE_SYNTHESIZER_PROMPT,
  ENTERPRISE_SYSTEM_PROMPT,
} from "@/lib/verticals/enterprise";
import {
  LEGAL_RESEARCHER_PROMPT,
  LEGAL_CRITIC_PROMPT,
  LEGAL_SYNTHESIZER_PROMPT,
  LEGAL_SYSTEM_PROMPT,
} from "@/lib/verticals/legal";
import type { AgentStep, Citation, MessagePart } from "@/lib/db/schema";

export type OrchestratorInput = {
  messages: CoreMessage[];
  organizationId: string;
  userId: string;
  chatId?: string;
  vertical?: string;
};

export type StreamEvent =
  | { type: "agent_step"; step: AgentStep }
  | { type: "token"; text: string }
  | { type: "citations"; citations: Citation[] }
  | { type: "parts"; parts: MessagePart[] }
  | { type: "error"; message: string }
  | { type: "done"; fullText: string };

function getModel() {
  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic(process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514");
  }
  if (process.env.OPENAI_API_KEY) {
    return openai(process.env.OPENAI_MODEL || "gpt-4o");
  }
  return openai("gpt-4o");
}

function getPrompts(vertical: string) {
  switch (vertical) {
    case "legal":
      return {
        system: LEGAL_SYSTEM_PROMPT,
        researcher: LEGAL_RESEARCHER_PROMPT,
        critic: LEGAL_CRITIC_PROMPT,
        synthesizer: LEGAL_SYNTHESIZER_PROMPT,
      };
    case "enterprise":
    default:
      return {
        system: ENTERPRISE_SYSTEM_PROMPT,
        researcher: ENTERPRISE_RESEARCHER_PROMPT,
        critic: ENTERPRISE_CRITIC_PROMPT,
        synthesizer: ENTERPRISE_SYNTHESIZER_PROMPT,
      };
  }
}

export async function* runOrchestrator(
  input: OrchestratorInput
): AsyncGenerator<StreamEvent> {
  const vertical = input.vertical || "enterprise";
  const prompts = getPrompts(vertical);
  const model = getModel();
  const toolCtx: ToolContext = {
    organizationId: input.organizationId,
    userId: input.userId,
    chatId: input.chatId,
  };

  const lastUser = [...input.messages].reverse().find((m) => m.role === "user");
  const userQuestion =
    typeof lastUser?.content === "string"
      ? lastUser.content
      : Array.isArray(lastUser?.content)
        ? lastUser.content.map((p: unknown) => (typeof p === "object" && p && "text" in p ? String((p as { text: string }).text) : "")).join(" ")
        : "";

  const citations: Citation[] = [];
  let researchNotes = "";

  yield {
    type: "agent_step",
    step: {
      agent: "researcher",
      status: "running",
      summary: "Gathering evidence from knowledge and tools…",
      startedAt: new Date().toISOString(),
    },
  };

  try {
    const tools = getToolsForAI();
    const research = await generateText({
      model,
      system: prompts.researcher,
      messages: [
        ...input.messages,
        {
          role: "user",
          content: `Research this question thoroughly. Use knowledge_search first. Question: ${userQuestion}`,
        },
      ],
      tools: Object.fromEntries(
        tools.map((t) => [
          t.function.name,
          {
            description: t.function.description,
            parameters: t.function.parameters,
            execute: async (args: Record<string, unknown>) => {
              const result = await runTool(t.function.name, args, toolCtx);
              if (result.citations?.length) {
                citations.push(...result.citations);
              }
              return result.content;
            },
          },
        ])
      ),
      maxSteps: 5,
    });

    researchNotes = research.text || "";
    yield {
      type: "agent_step",
      step: {
        agent: "researcher",
        status: "done",
        summary: researchNotes.slice(0, 200) || "Research complete",
        finishedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    yield {
      type: "agent_step",
      step: {
        agent: "researcher",
        status: "error",
        summary: message,
        finishedAt: new Date().toISOString(),
      },
    };
    researchNotes = `Research failed: ${message}`;
  }

  if (citations.length) {
    const seen = new Set<string>();
    const unique = citations.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
    citations.length = 0;
    citations.push(...unique);
    yield { type: "citations", citations: unique };
  }

  yield {
    type: "agent_step",
    step: {
      agent: "critic",
      status: "running",
      summary: "Checking grounding and gaps…",
      startedAt: new Date().toISOString(),
    },
  };

  let critique = "";
  try {
    const criticResult = await generateText({
      model,
      system: prompts.critic,
      messages: [
        {
          role: "user",
          content: `Question: ${userQuestion}\n\nResearch findings:\n${researchNotes}\n\nCitations: ${JSON.stringify(citations.map((c) => ({ title: c.title, snippet: c.snippet.slice(0, 120) })))}`,
        },
      ],
    });
    critique = criticResult.text || "";
    yield {
      type: "agent_step",
      step: {
        agent: "critic",
        status: "done",
        summary: critique.slice(0, 200) || "Critique complete",
        finishedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    yield {
      type: "agent_step",
      step: {
        agent: "critic",
        status: "error",
        summary: message,
        finishedAt: new Date().toISOString(),
      },
    };
    critique = "Critic unavailable; proceed with research notes only.";
  }

  yield {
    type: "agent_step",
    step: {
      agent: "synthesizer",
      status: "running",
      summary: "Writing grounded answer…",
      startedAt: new Date().toISOString(),
    },
  };

  try {
    const result = streamText({
      model,
      system: prompts.system + "\n\n" + prompts.synthesizer,
      messages: [
        ...input.messages,
        {
          role: "user",
          content: `Produce the final answer.\n\nQuestion: ${userQuestion}\n\nResearch:\n${researchNotes}\n\nCritique:\n${critique}\n\nCite sources as [1], [2], etc. Use generative blocks (chart/table/callout) when helpful.`,
        },
      ],
    });

    let fullText = "";
    for await (const delta of result.textStream) {
      fullText += delta;
      yield { type: "token", text: delta };
    }

    const parts = parseGenerativeParts(fullText, citations);
    if (parts.length) {
      yield { type: "parts", parts };
    }

    yield {
      type: "agent_step",
      step: {
        agent: "synthesizer",
        status: "done",
        summary: "Answer ready",
        finishedAt: new Date().toISOString(),
      },
    };

    yield { type: "done", fullText };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    yield {
      type: "agent_step",
      step: {
        agent: "synthesizer",
        status: "error",
        summary: message,
        finishedAt: new Date().toISOString(),
      },
    };
    yield { type: "error", message };
  }
}

function parseGenerativeParts(
  text: string,
  citations: Citation[]
): MessagePart[] {
  const parts: MessagePart[] = [];

  if (citations.length) {
    parts.push({ type: "sources", data: citations });
  }

  const chartMatch = text.match(/```chart\s*([\s\S]*?)```/);
  if (chartMatch) {
    try {
      const data = JSON.parse(chartMatch[1].trim());
      parts.push({ type: "chart", data });
    } catch {
      /* ignore malformed */
    }
  }

  const tableMatch = text.match(/```table\s*([\s\S]*?)```/);
  if (tableMatch) {
    try {
      const data = JSON.parse(tableMatch[1].trim());
      parts.push({ type: "table", data });
    } catch {
      /* ignore */
    }
  }

  const calloutMatch = text.match(/```callout\s*([\s\S]*?)```/);
  if (calloutMatch) {
    try {
      const data = JSON.parse(calloutMatch[1].trim());
      parts.push({ type: "callout", data });
    } catch {
      /* ignore */
    }
  }

  return parts;
}
