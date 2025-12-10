// ADR: ADR-011-web-api-architecture
"use client";

import { FolderOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RequestGroupBadgeProps {
  /** Group name to display */
  groupName: string;
  /** Whether the badge is clickable */
  clickable?: boolean;
  /** Callback when the badge is clicked */
  onClick?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * RequestGroupBadge displays a group membership indicator on a request card.
 * Shows the group name with a folder icon.
 */
export function RequestGroupBadge({
  groupName,
  clickable = false,
  onClick,
  className,
}: RequestGroupBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-xs font-normal text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
        clickable && "cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950",
        className
      )}
      onClick={clickable ? onClick : undefined}
    >
      <FolderOpen className="h-3 w-3" />
      <span className="truncate max-w-[120px]">{groupName}</span>
    </Badge>
  );
}
