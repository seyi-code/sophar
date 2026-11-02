"use client";

import type { TablePayload } from "@/lib/db/schema";

export function Table({ data }: { data: TablePayload }) {
  const { title, columns, rows } = data;

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm animate-fade-in">
      {title && (
        <div className="border-b border-border px-4 py-2.5">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-left font-medium text-muted-foreground"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border last:border-0 hover:bg-muted/30"
              >
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2.5 text-foreground">
                    {row[col] === null || row[col] === undefined
                      ? "—"
                      : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
