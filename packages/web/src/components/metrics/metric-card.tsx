// ADR: ADR-011-web-api-architecture

import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { TrendIndicator, type TrendDirection } from "./trend-indicator";

/**
 * Trend data for the metric
 */
export interface MetricTrend {
  /** Percentage change value */
  value: number;
  /** Direction of the trend */
  direction: TrendDirection;
}

interface MetricCardProps {
  /** Title of the metric */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Description or context for the value */
  description?: string;
  /** Icon component to display */
  icon?: LucideIcon;
  /** Optional trend indicator */
  trend?: MetricTrend;
  /** Additional class names */
  className?: string;
}

/**
 * MetricCard displays a KPI with optional trend indicator.
 * Shows title, prominent value, description, and icon.
 */
export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <TrendIndicator value={trend.value} direction={trend.direction} />
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
