"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartPayload } from "@/lib/db/schema";

const COLORS = ["#0c8ce9", "#0158a1", "#36a7f8", "#7cc5fc", "#064b85", "#b9dffd"];

export function Chart({ data }: { data: ChartPayload }) {
  const { type, title, data: rows, xKey, yKeys } = data;

  return (
    <div className="my-4 rounded-xl border border-border bg-card p-4 shadow-sm animate-fade-in">
      {title && (
        <h4 className="mb-3 text-sm font-semibold text-foreground">{title}</h4>
      )}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {yKeys.map((k, i) => (
                <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : type === "line" ? (
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {yKeys.map((k, i) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          ) : type === "area" ? (
            <AreaChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {yKeys.map((k, i) => (
                <Area
                  key={k}
                  type="monotone"
                  dataKey={k}
                  stroke={COLORS[i % COLORS.length]}
                  fill={COLORS[i % COLORS.length]}
                  fillOpacity={0.2}
                />
              ))}
            </AreaChart>
          ) : (
            <PieChart>
              <Pie
                data={rows}
                dataKey={yKeys[0]}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {rows.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
