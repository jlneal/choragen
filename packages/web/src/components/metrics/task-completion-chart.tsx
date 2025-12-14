// ADR: ADR-011-web-api-architecture
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { ChartContainer } from "./chart-container";
import type { TaskCompletionDataPoint } from "@/hooks";

interface TaskCompletionChartProps {
  /** Array of completion data points */
  data: TaskCompletionDataPoint[];
  /** Chart title */
  title?: string;
  /** Chart description */
  description?: string;
  /** Additional class names */
  className?: string;
}

/**
 * TaskCompletionChart displays tasks completed over time as a bar chart.
 * Uses Recharts with responsive container and CSS variable colors.
 */
export function TaskCompletionChart({
  data,
  title = "Task Completions",
  description = "Tasks completed over time",
  className,
}: TaskCompletionChartProps) {
  const isEmpty = data.length === 0;

  return (
    <ChartContainer
      title={title}
      description={description}
      isEmpty={isEmpty}
      className={className}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-muted"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="fill-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="fill-muted-foreground"
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
              fontSize: 12,
            }}
            labelStyle={{ color: "hsl(var(--popover-foreground))" }}
            itemStyle={{ color: "hsl(var(--popover-foreground))" }}
          />
          <Bar
            dataKey="count"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            name="Tasks"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
