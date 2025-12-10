// ADR: ADR-011-web-api-architecture
"use client";

/**
 * Time range filter component for metrics dashboard
 *
 * Displays a button group for selecting time ranges (7d, 30d, 90d, All).
 */
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type TimeRange, TIME_RANGE_OPTIONS } from "@/hooks/use-time-range";

interface TimeRangeFilterProps {
  /** Currently selected time range */
  value: TimeRange;
  /** Callback when time range changes */
  onChange: (range: TimeRange) => void;
  /** Additional class names */
  className?: string;
}

/**
 * TimeRangeFilter displays a button group for selecting time ranges.
 *
 * Uses a segmented button pattern with visual highlighting for the selected option.
 * Supports keyboard navigation via native button focus handling.
 *
 * @example
 * ```tsx
 * const { range, setRange } = useTimeRange();
 *
 * <TimeRangeFilter value={range} onChange={setRange} />
 * ```
 */
export function TimeRangeFilter({
  value,
  onChange,
  className,
}: TimeRangeFilterProps) {
  return (
    <div
      className={cn("inline-flex rounded-md border border-input", className)}
      role="group"
      aria-label="Time range filter"
    >
      {TIME_RANGE_OPTIONS.map((option, index) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            "rounded-none border-0",
            // First button: round left corners
            index === 0 && "rounded-l-md",
            // Last button: round right corners
            index === TIME_RANGE_OPTIONS.length - 1 && "rounded-r-md",
            // Unselected buttons: transparent background
            value !== option.value && "bg-transparent hover:bg-accent"
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
