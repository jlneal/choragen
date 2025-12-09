// ADR: ADR-011-web-api-architecture

import { cn } from "@/lib/utils";

interface ChainProgressProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Show percentage text */
  showLabel?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional class names */
  className?: string;
}

/**
 * Size configuration for the progress bar
 */
const sizeConfig = {
  sm: { bar: "h-1.5", text: "text-xs" },
  md: { bar: "h-2", text: "text-sm" },
  lg: { bar: "h-3", text: "text-base" },
};

/**
 * Get progress bar color based on completion percentage
 */
function getProgressColor(progress: number): string {
  if (progress === 100) {
    return "bg-green-500 dark:bg-green-400";
  }
  if (progress >= 75) {
    return "bg-emerald-500 dark:bg-emerald-400";
  }
  if (progress >= 50) {
    return "bg-amber-500 dark:bg-amber-400";
  }
  if (progress >= 25) {
    return "bg-orange-500 dark:bg-orange-400";
  }
  return "bg-blue-500 dark:bg-blue-400";
}

/**
 * ChainProgress displays a visual progress bar for chain completion.
 * Color coding indicates completion level for quick visual assessment.
 */
export function ChainProgress({
  progress,
  showLabel = false,
  size = "md",
  className,
}: ChainProgressProps) {
  // Clamp progress to 0-100 range
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const roundedProgress = Math.round(clampedProgress);
  const config = sizeConfig[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex-1 overflow-hidden rounded-full bg-secondary",
          config.bar
        )}
        role="progressbar"
        aria-valuenow={roundedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${roundedProgress}% complete`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-in-out",
            getProgressColor(roundedProgress)
          )}
          style={{ width: `${roundedProgress}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            "min-w-[3ch] text-right font-medium text-muted-foreground",
            config.text
          )}
        >
          {roundedProgress}%
        </span>
      )}
    </div>
  );
}
