// ADR: ADR-011-web-api-architecture

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Direction of the trend
 */
export type TrendDirection = "up" | "down" | "neutral";

interface TrendIndicatorProps {
  /** Percentage change value */
  value: number;
  /** Direction of the trend */
  direction: TrendDirection;
  /** Additional class names */
  className?: string;
}

/**
 * Configuration for trend direction styling
 */
const trendConfig: Record<
  TrendDirection,
  { icon: typeof TrendingUp; className: string }
> = {
  up: {
    icon: TrendingUp,
    className: "text-green-600 dark:text-green-400",
  },
  down: {
    icon: TrendingDown,
    className: "text-red-600 dark:text-red-400",
  },
  neutral: {
    icon: Minus,
    className: "text-muted-foreground",
  },
};

/**
 * TrendIndicator displays a directional arrow with percentage change.
 * Green for positive trends, red for negative, neutral for no change.
 */
export function TrendIndicator({
  value,
  direction,
  className,
}: TrendIndicatorProps) {
  const config = trendConfig[direction];
  const Icon = config.icon;

  // Format the value with sign prefix
  const formattedValue =
    direction === "up"
      ? `+${value.toFixed(1)}%`
      : direction === "down"
        ? `-${Math.abs(value).toFixed(1)}%`
        : `${value.toFixed(1)}%`;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{formattedValue}</span>
    </div>
  );
}
