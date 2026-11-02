"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageList, type ChatMessage } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { KnowledgePanel } from "@/components/knowledge/KnowledgePanel";
import { Onboarding } from "@/components/onboarding/Onboarding";
import type { AgentStep, MessagePart, Citation } from "@/lib/db/schema";
import { BookOpen, Sparkles } from "lucide-react";

type StreamEvent =
  | { type: "agent_step"; step: AgentStep }
  | { type: "token"; text: string }
  | { type: "citations"; citations: Citation[] }
  | { type: "parts"; parts: MessagePart[] }
  | { type: "error"; message: string }
  | { type: "done"; fullText: string };

export default function HomePage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("Workspace");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingSteps, setStreamingSteps] = useState<AgentStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sophar.org");
      if (raw) {
        const parsed = JSON.parse(raw) as { id: string; name?: string };
        if (parsed.id) {
          setOrgId(parsed.id);
          if (parsed.name) setOrgName(parsed.name);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingSteps]);

  const handleOnboardingComplete = (id: string) => {
    setOrgId(id);
    try {
      const raw = localStorage.getItem("sophar.org");
      if (raw) {
        const parsed = JSON.parse(raw) as { name?: string };
        if (parsed.name) setOrgName(parsed.name);
      }
    } catch {
      /* ignore */
    }
  };

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (!orgId || !text.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setStreamingSteps([]);

      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", parts: [], agentSteps: [] },
      ]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            organizationId: orgId,
            vertical: "enterprise",
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`Stream failed: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";
        let citations: Citation[] = [];
        let parts: MessagePart[] = [];
        let steps: AgentStep[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === "[DONE]") continue;
            try {
              const event = JSON.parse(raw) as StreamEvent;
              if (event.type === "agent_step") {
                steps = [...steps.filter((s) => s.agent !== event.step.agent), event.step];
                setStreamingSteps(steps);
              } else if (event.type === "token") {
                fullText += event.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: fullText } : m
                  )
                );
              } else if (event.type === "citations") {
                citations = event.citations;
              } else if (event.type === "parts") {
                parts = event.parts;
              } else if (event.type === "done") {
                fullText = event.fullText || fullText;
              } else if (event.type === "error") {
                fullText += `\n\n[Error] ${event.message}`;
              }
            } catch {
              /* ignore parse errors */
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: fullText,
                  parts,
                  citations,
                  agentSteps: steps,
                }
              : m
          )
        );
        setStreamingSteps([]);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          const msg = err instanceof Error ? err.message : String(err);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content || `Error: ${msg}` }
                : m
            )
          );
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [orgId, messages, isLoading]
  );

  if (!orgId) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sophar-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">Sophar</div>
            <div className="text-xs text-muted-foreground">{orgName}</div>
          </div>
        </div>
        <button
          onClick={() => setKnowledgeOpen(true)}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
        >
          <BookOpen className="h-4 w-4" /> Knowledge
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl">
          <MessageList messages={messages} streamingSteps={streamingSteps} />
          <div ref={bottomRef} />
        </div>
      </main>

      <ChatInput onSubmit={send} onStop={stop} isLoading={isLoading} />

      <KnowledgePanel
        organizationId={orgId}
        open={knowledgeOpen}
        onClose={() => setKnowledgeOpen(false)}
      />
    </div>
  );
}
