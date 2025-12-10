// ADR: ADR-011-web-api-architecture

import { BarChart3 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartContainerProps {
  /** Title of the chart */
  title: string;
  /** Description or context for the chart */
  description?: string;
  /** Whether the chart has no data */
  isEmpty?: boolean;
  /** Chart content */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * ChartContainer wraps chart components with Card styling.
 * Provides consistent title, description, and empty state handling.
 */
export function ChartContainer({
  title,
  description,
  isEmpty = false,
  children,
  className,
}: ChartContainerProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <ChartEmptyState />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Empty state displayed when chart has no data
 */
function ChartEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
      <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
      <p className="text-sm">No data available</p>
    </div>
  );
}
