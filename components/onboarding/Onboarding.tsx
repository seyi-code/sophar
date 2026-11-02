"use client";

import { useState } from "react";
import { Building2, Upload, Sparkles, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const STEPS = [
  {
    id: "workspace",
    title: "Create your workspace",
    description: "Enterprise knowledge is isolated per organization. Start with a name.",
  },
  {
    id: "upload",
    title: "Add knowledge",
    description: "Upload policies, runbooks, and product docs so answers are grounded.",
  },
  {
    id: "ready",
    title: "You're ready",
    description: "Ask questions. Sophar researches, critiques, and synthesizes with citations.",
  },
];

export function Onboarding({
  onComplete,
}: {
  onComplete: (organizationId: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [orgId, setOrgId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  const createWorkspace = async () => {
    if (!orgName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName.trim(),
          vertical: "enterprise",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.organization?.id) {
        throw new Error(json.error || "Failed to create organization");
      }
      const id = json.organization.id as string;
      setOrgId(id);
      localStorage.setItem(
        "sophar.org",
        JSON.stringify({
          id,
          name: json.organization.name || orgName.trim(),
          vertical: json.organization.vertical || "enterprise",
          slug: json.organization.slug,
        })
      );
      setStep(1);
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "Could not create workspace. Check DATABASE_URL and try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const uploadDoc = async () => {
    if (!title.trim() || !content.trim() || !orgId) {
      setStep(2);
      return;
    }
    setBusy(true);
    try {
      await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: orgId,
          title: title.trim(),
          content,
          source: "onboarding",
          mimeType: "text/plain",
        }),
      });
      setStep(2);
    } catch {
      setStep(2);
    } finally {
      setBusy(false);
    }
  };

  const finish = () => {
    if (orgId) onComplete(orgId);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sophar-600 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">Sophar</div>
            <div className="text-xs text-muted-foreground">Knowledge assistant setup</div>
          </div>
        </div>

        <ol className="mb-6 flex gap-2">
          {STEPS.map((s, i) => (
            <li
              key={s.id}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i <= step ? "bg-sophar-600" : "bg-muted"
              )}
            />
          ))}
        </ol>

        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-semibold">{STEPS[step].title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{STEPS[step].description}</p>
          </div>

          {step === 0 && (
            <>
              <label className="block text-sm font-medium">Workspace name</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && createWorkspace()}
                  />
                </div>
              </div>
              <button
                onClick={createWorkspace}
                disabled={busy || !orgName.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-sophar-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sophar-700 disabled:opacity-50"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <label className="block text-sm font-medium">Document title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Remote Work Policy"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <label className="block text-sm font-medium">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste policy text…"
                rows={6}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-md border border-border px-4 py-2.5 text-sm hover:bg-muted"
                >
                  Skip
                </button>
                <button
                  onClick={uploadDoc}
                  disabled={busy}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-sophar-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sophar-700 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" /> Upload & continue
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                <Check className="h-5 w-5 shrink-0" />
                <span>Workspace ready. Start asking grounded questions.</span>
              </div>
              <button
                onClick={finish}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-sophar-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sophar-700"
              >
                Open Sophar <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
