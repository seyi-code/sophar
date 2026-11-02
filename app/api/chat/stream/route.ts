import { NextRequest } from "next/server";
import { runOrchestrator, type StreamEvent } from "@/lib/agents/orchestrator";
import { auth } from "@/lib/auth/better-auth";
import { db } from "@/lib/db";
import { chats, messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { CoreMessage } from "ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/chat/stream
 *
 * Body: {
 *   messages: CoreMessage[],
 *   chatId?: string,
 *   organizationId: string,
 *   vertical?: string
 * }
 *
 * Response: text/event-stream
 * Events: agent_step | token | citations | parts | error | done
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    // Allow unauthenticated in local demo mode
    const userId = session?.user?.id || "demo-user";

    const body = await req.json();
    const {
      messages: clientMessages,
      chatId,
      organizationId,
      vertical = "enterprise",
    } = body as {
      messages: CoreMessage[];
      chatId?: string;
      organizationId: string;
      vertical?: string;
    };

    if (!organizationId) {
      return new Response(JSON.stringify({ error: "organizationId required" }), {
        status: 400,
      });
    }

    if (!Array.isArray(clientMessages) || clientMessages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
      });
    }

    // Persist user message if chat exists
    let activeChatId = chatId;
    if (activeChatId) {
      const last = clientMessages[clientMessages.length - 1];
      if (last?.role === "user") {
        const content =
          typeof last.content === "string"
            ? last.content
            : JSON.stringify(last.content);
        await db.insert(messages).values({
          chatId: activeChatId,
          role: "user",
          content,
        });
      }
    }

    const encoder = new TextEncoder();
    let fullAssistant = "";
    let finalCitations: unknown[] = [];
    let finalParts: unknown[] = [];
    let agentSteps: unknown[] = [];

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: StreamEvent) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        };

        try {
          for await (const event of runOrchestrator({
            messages: clientMessages,
            organizationId,
            userId,
            chatId: activeChatId,
            vertical,
          })) {
            send(event);

            if (event.type === "token") fullAssistant += event.text;
            if (event.type === "done") fullAssistant = event.fullText;
            if (event.type === "citations") finalCitations = event.citations;
            if (event.type === "parts") finalParts = event.parts;
            if (event.type === "agent_step") {
              agentSteps = [...agentSteps, event.step];
            }
          }

          // Persist assistant message
          if (activeChatId && fullAssistant) {
            await db.insert(messages).values({
              chatId: activeChatId,
              role: "assistant",
              content: fullAssistant,
              parts: finalParts as never,
              agentSteps: agentSteps as never,
              citations: finalCitations as never,
            });

            await db
              .update(chats)
              .set({ updatedAt: new Date() })
              .where(eq(chats.id, activeChatId));
          }
        } catch (err) {
          send({
            type: "error",
            message: err instanceof Error ? err.message : String(err),
          });
        } finally {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[chat/stream]", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal error",
      }),
      { status: 500 }
    );
  }
}
