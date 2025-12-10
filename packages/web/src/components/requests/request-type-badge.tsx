// ADR: ADR-011-web-api-architecture

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Valid request type values
 */
export type RequestType = "change-request" | "fix-request";

interface RequestTypeBadgeProps {
  type: RequestType;
  className?: string;
}

/**
 * Type badge styling configuration
 */
const typeConfig: Record<RequestType, { label: string; className: string }> = {
  "change-request": {
    label: "CR",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
  },
  "fix-request": {
    label: "FR",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  },
};

/**
 * RequestTypeBadge displays the type of a request (CR or FR)
 * with appropriate color coding for quick visual identification.
 */
export function RequestTypeBadge({ type, className }: RequestTypeBadgeProps) {
  const config = typeConfig[type];

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-medium text-xs",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
