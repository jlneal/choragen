// ADR: ADR-011-web-api-architecture

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChartSkeletonProps {
  /** Type of chart skeleton to display */
  variant?: "bar" | "line";
  /** Additional class names */
  className?: string;
}

const CHART_HEIGHT = 300;
const BAR_COUNT = 7;
const LINE_POINT_COUNT = 7;

/**
 * ChartSkeleton provides a loading state for chart components.
 * Displays placeholder bars or lines matching chart dimensions.
 */
export function ChartSkeleton({ variant = "bar", className }: ChartSkeletonProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        {/* Title skeleton */}
        <Skeleton className="h-5 w-32" />
        {/* Description skeleton */}
        <Skeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height: CHART_HEIGHT }}>
          {variant === "bar" ? <BarChartSkeleton /> : <LineChartSkeleton />}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Bar chart loading skeleton
 */
function BarChartSkeleton() {
  // Generate random heights for visual variety
  const barHeights = [60, 80, 45, 90, 70, 55, 75];

  return (
    <div className="flex items-end justify-between h-full gap-2 pb-8">
      {barHeights.slice(0, BAR_COUNT).map((height, index) => (
        <div key={index} className="flex-1 flex flex-col items-center gap-2">
          <Skeleton
            className="w-full rounded-t"
            style={{ height: `${height}%` }}
          />
          {/* X-axis label skeleton */}
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
    </div>
  );
}

/**
 * Line chart loading skeleton
 */
function LineChartSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Y-axis area with line placeholder */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full h-px bg-muted relative">
          {/* Animated pulse line */}
          <Skeleton className="absolute inset-0 h-0.5" />
          {/* Data points */}
          <div className="absolute inset-0 flex items-center justify-between px-4">
            {Array.from({ length: LINE_POINT_COUNT }).map((_, index) => (
              <Skeleton key={index} className="h-3 w-3 rounded-full" />
            ))}
          </div>
        </div>
      </div>
      {/* X-axis labels */}
      <div className="flex justify-between pt-4">
        {Array.from({ length: LINE_POINT_COUNT }).map((_, index) => (
          <Skeleton key={index} className="h-3 w-8" />
        ))}
      </div>
    </div>
  );
}
