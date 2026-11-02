"use client";

import type { Citation } from "@/lib/db/schema";
import { FileText } from "lucide-react";

export function Sources({ data }: { data: Citation[] }) {
  if (!data?.length) return null;

  return (
    <div className="my-4 rounded-xl border border-border bg-card p-4 shadow-sm animate-fade-in">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <FileText className="h-4 w-4 text-sophar-600" />
        Sources
      </h4>
      <ol className="space-y-3">
        {data.map((c, i) => (
          <li key={c.id} className="flex gap-3 text-sm">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-sophar-100 text-xs font-medium text-sophar-700">
              {i + 1}
            </span>
            <div className="min-w-0">
              <div className="font-medium text-foreground">{c.title}</div>
              {c.source && (
                <div className="text-xs text-muted-foreground">{c.source}</div>
              )}
              <p className="mt-0.5 line-clamp-2 text-muted-foreground">
                {c.snippet}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
