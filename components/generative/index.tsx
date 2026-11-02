"use client";

import type { MessagePart } from "@/lib/db/schema";
import { Chart } from "./Chart";
import { Table } from "./Table";
import { Sources } from "./Sources";
import { Callout } from "./Callout";

export function GenerativeParts({ parts }: { parts?: MessagePart[] | null }) {
  if (!parts?.length) return null;

  return (
    <div className="space-y-1">
      {parts.map((part, i) => {
        switch (part.type) {
          case "chart":
            return <Chart key={i} data={part.data} />;
          case "table":
            return <Table key={i} data={part.data} />;
          case "sources":
            return <Sources key={i} data={part.data} />;
          case "callout":
            return <Callout key={i} data={part.data} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

export { Chart, Table, Sources, Callout };
