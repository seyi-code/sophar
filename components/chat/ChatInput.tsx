"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function ChatInput({
  onSubmit,
  onStop,
  isLoading,
  placeholder = "Ask about policies, processes, products…",
}: {
  onSubmit: (value: string) => void;
  onStop?: () => void;
  isLoading?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-end gap-2 px-4 py-3">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={placeholder}
            rows={1}
            className={cn(
              "w-full resize-none rounded-xl border border-input bg-card px-4 py-3 pr-12 text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sophar-500/40"
            )}
            disabled={isLoading}
          />
        </div>

        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted"
            aria-label="Stop"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!value.trim()}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sophar-600 text-white",
              "hover:bg-sophar-700 disabled:opacity-40 disabled:hover:bg-sophar-600"
            )}
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
