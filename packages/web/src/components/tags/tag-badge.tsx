// ADR: ADR-011-web-api-architecture
"use client";

import { X, Tag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  /** The tag text */
  tag: string;
  /** Whether the tag is clickable (for filtering) */
  clickable?: boolean;
  /** Whether to show a remove button */
  removable?: boolean;
  /** Callback when the tag is clicked */
  onClick?: (tag: string) => void;
  /** Callback when the remove button is clicked */
  onRemove?: (tag: string) => void;
  /** Additional class names */
  className?: string;
}

/**
 * TagBadge displays a single tag as a badge.
 * Can be clickable (for filtering) and/or removable.
 */
export function TagBadge({
  tag,
  clickable = false,
  removable = false,
  onClick,
  onRemove,
  className,
}: TagBadgeProps) {
  const handleClick = () => {
    if (clickable && onClick) {
      onClick(tag);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(tag);
    }
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1 text-xs font-normal",
        clickable && "cursor-pointer hover:bg-secondary/80",
        className
      )}
      onClick={clickable ? handleClick : undefined}
    >
      <Tag className="h-3 w-3" />
      <span>{tag}</span>
      {removable && (
        <button
          type="button"
          onClick={handleRemove}
          className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
          aria-label={`Remove tag ${tag}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}

interface TagListProps {
  /** Array of tags to display */
  tags: string[];
  /** Whether tags are clickable */
  clickable?: boolean;
  /** Whether tags are removable */
  removable?: boolean;
  /** Callback when a tag is clicked */
  onTagClick?: (tag: string) => void;
  /** Callback when a tag is removed */
  onTagRemove?: (tag: string) => void;
  /** Maximum number of tags to show before truncating */
  maxVisible?: number;
  /** Additional class names */
  className?: string;
}

/**
 * TagList displays a list of tags as badges.
 */
export function TagList({
  tags,
  clickable = false,
  removable = false,
  onTagClick,
  onTagRemove,
  maxVisible,
  className,
}: TagListProps) {
  if (tags.length === 0) {
    return null;
  }

  const visibleTags = maxVisible ? tags.slice(0, maxVisible) : tags;
  const hiddenCount = maxVisible ? Math.max(0, tags.length - maxVisible) : 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {visibleTags.map((tag) => (
        <TagBadge
          key={tag}
          tag={tag}
          clickable={clickable}
          removable={removable}
          onClick={onTagClick}
          onRemove={onTagRemove}
        />
      ))}
      {hiddenCount > 0 && (
        <Badge variant="outline" className="text-xs font-normal">
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  );
}
