// ADR: ADR-011-web-api-architecture
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { ChartContainer } from "./chart-container";
import type { ReworkTrendDataPoint } from "@/hooks";

interface ReworkTrendChartProps {
  /** Array of rework rate data points */
  data: ReworkTrendDataPoint[];
  /** Chart title */
  title?: string;
  /** Chart description */
  description?: string;
  /** Additional class names */
  className?: string;
}

/**
 * ReworkTrendChart displays rework rate over time as a line chart.
 * Shows percentage on Y-axis with CSS variable colors.
 */
export function ReworkTrendChart({
  data,
  title = "Rework Rate",
  description = "Percentage of tasks requiring rework",
  className,
}: ReworkTrendChartProps) {
  const isEmpty = data.length === 0;

  return (
    <ChartContainer
      title={title}
      description={description}
      isEmpty={isEmpty}
      className={className}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            domain={[0, 100]}
            tickFormatter={(value: number) => `${value}%`}
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
            formatter={(value: number) => [`${value.toFixed(1)}%`, "Rework Rate"]}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="hsl(var(--destructive))"
            strokeWidth={2}
            dot={{
              fill: "hsl(var(--destructive))",
              strokeWidth: 0,
              r: 4,
            }}
            activeDot={{
              fill: "hsl(var(--destructive))",
              strokeWidth: 0,
              r: 6,
            }}
            name="Rework Rate"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
