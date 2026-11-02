"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AgentStep, MessagePart } from "@/lib/db/schema";
import { GenerativeParts } from "@/components/generative";
import { AgentSteps } from "./AgentSteps";
import { cn } from "@/lib/utils/cn";
import { User, Sparkles } from "lucide-react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  parts?: MessagePart[] | null;
  agentSteps?: AgentStep[] | null;
};

export function MessageList({
  messages,
  streamingSteps,
}: {
  messages: ChatMessage[];
  streamingSteps?: AgentStep[];
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
      {messages.map((m) => (
        <div
          key={m.id}
          className={cn(
            "flex gap-3 animate-fade-in",
            m.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          {m.role === "assistant" && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sophar-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
          )}

          <div
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
              m.role === "user"
                ? "bg-sophar-600 text-white"
                : "bg-card border border-border text-foreground shadow-sm"
            )}
          >
            {m.role === "assistant" && m.agentSteps && m.agentSteps.length > 0 && (
              <AgentSteps steps={m.agentSteps} />
            )}

            <div
              className={cn(
                "prose prose-sm max-w-none dark:prose-invert",
                m.role === "user" && "prose-invert"
              )}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {m.content}
              </ReactMarkdown>
            </div>

            {m.role === "assistant" && m.parts && (
              <GenerativeParts parts={m.parts} />
            )}
          </div>

          {m.role === "user" && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <User className="h-4 w-4" />
            </div>
          )}
        </div>
      ))}

      {streamingSteps && streamingSteps.length > 0 && (
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sophar-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
            <AgentSteps steps={streamingSteps} />
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 animate-pulse-soft rounded-full bg-sophar-500" />
              Working…
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
