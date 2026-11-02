"use client";

import type { AgentStep } from "@/lib/db/schema";
import { cn } from "@/lib/utils/cn";
import { Check, Loader2, X, Search, Scale, PenLine } from "lucide-react";

const icons = {
  researcher: Search,
  critic: Scale,
  synthesizer: PenLine,
  tool: Search,
};

const labels = {
  researcher: "Researcher",
  critic: "Critic",
  synthesizer: "Synthesizer",
  tool: "Tool",
};

export function AgentSteps({ steps }: { steps: AgentStep[] }) {
  if (!steps.length) return null;

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {steps.map((step, i) => {
        const Icon = icons[step.agent] || Search;
        const isRunning = step.status === "running";
        const isError = step.status === "error";
        const isDone = step.status === "done";

        return (
          <div
            key={`${step.agent}-${i}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              isRunning && "border-sophar-300 bg-sophar-50 text-sophar-800",
              isDone && "border-emerald-200 bg-emerald-50 text-emerald-800",
              isError && "border-red-200 bg-red-50 text-red-800"
            )}
            title={step.summary}
          >
            {isRunning ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isError ? (
              <X className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            <Icon className="h-3 w-3 opacity-70" />
            <span>{labels[step.agent]}</span>
          </div>
        );
      })}
    </div>
  );
}
