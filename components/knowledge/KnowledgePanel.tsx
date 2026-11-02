"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Upload, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Doc = {
  id: string;
  title: string;
  source?: string | null;
  status: string;
  createdAt: string;
};

export function KnowledgePanel({
  organizationId,
  open,
  onClose,
}: {
  organizationId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const refresh = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/knowledge?organizationId=${encodeURIComponent(organizationId)}`
      );
      const json = await res.json();
      setDocs(json.documents || []);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const handleUpload = async () => {
    if (!title.trim() || !content.trim()) return;
    setUploading(true);
    try {
      await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          title: title.trim(),
          content,
          source: "manual-upload",
          mimeType: "text/plain",
        }),
      });
      setTitle("");
      setContent("");
      await refresh();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(
      `/api/knowledge?organizationId=${encodeURIComponent(organizationId)}&documentId=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    await refresh();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-xl animate-fade-in">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Knowledge base</h2>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted">
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Upload document
            </h3>
            <div className="space-y-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste policy or document text..."
                rows={8}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                onClick={handleUpload}
                disabled={uploading || !title.trim() || !content.trim()}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md bg-sophar-600 px-3 py-2 text-sm font-medium text-white",
                  "hover:bg-sophar-700 disabled:opacity-50"
                )}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload
              </button>
            </div>
          </section>
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Documents</h3>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>
            <ul className="space-y-2">
              {docs.map((d) => (
                <li key={d.id} className="flex items-start gap-2 rounded-lg border border-border bg-card p-3">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-sophar-600" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{d.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      {d.status === "ready" && (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" /> Ready
                        </span>
                      )}
                      {d.status === "processing" && (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <Loader2 className="h-3 w-3 animate-spin" /> Processing
                        </span>
                      )}
                      {d.status === "failed" && (
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <XCircle className="h-3 w-3" /> Failed
                        </span>
                      )}
                      {d.source && <span className="truncate">{d.source}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-600"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {!loading && docs.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No documents yet. Upload policies, runbooks, or product docs to ground answers.
                </p>
              )}
            </ul>
          </section>
        </div>
      </aside>
    </div>
  );
}
