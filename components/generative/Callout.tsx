"use client";

import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import type { CalloutPayload } from "@/lib/db/schema";
import { cn } from "@/lib/utils/cn";

const variants = {
  info: {
    icon: Info,
    className: "border-sophar-200 bg-sophar-50 text-sophar-900",
    iconClass: "text-sophar-600",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-amber-200 bg-amber-50 text-amber-900",
    iconClass: "text-amber-600",
  },
  success: {
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    iconClass: "text-emerald-600",
  },
  danger: {
    icon: AlertCircle,
    className: "border-red-200 bg-red-50 text-red-900",
    iconClass: "text-red-600",
  },
};

export function Callout({ data }: { data: CalloutPayload }) {
  const v = variants[data.variant] || variants.info;
  const Icon = v.icon;

  return (
    <div
      className={cn(
        "my-4 flex gap-3 rounded-xl border p-4 animate-fade-in",
        v.className
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", v.iconClass)} />
      <div>
        {data.title && (
          <div className="mb-1 text-sm font-semibold">{data.title}</div>
        )}
        <p className="text-sm leading-relaxed">{data.body}</p>
      </div>
    </div>
  );
}
