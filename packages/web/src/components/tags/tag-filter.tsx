// ADR: ADR-011-web-api-architecture
"use client";

import { useState } from "react";
import { Check, ChevronDown, Tag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TagFilterProps {
  /** Currently selected tags */
  selectedTags: string[];
  /** Available tags to choose from */
  availableTags: string[];
  /** Callback when selection changes */
  onSelectionChange: (tags: string[]) => void;
  /** Additional class names */
  className?: string;
}

/**
 * TagFilter provides a multi-select dropdown for filtering by tags.
 */
export function TagFilter({
  selectedTags,
  availableTags,
  onSelectionChange,
  className,
}: TagFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onSelectionChange(selectedTags.filter((t) => t !== tag));
    } else {
      onSelectionChange([...selectedTags, tag]);
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const hasSelection = selectedTags.length > 0;

  if (availableTags.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm font-medium text-muted-foreground">Tags:</span>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 min-w-[100px] text-xs justify-between"
          >
            <span className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {hasSelection ? `${selectedTags.length} selected` : "All tags"}
            </span>
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[180px] max-h-[300px] overflow-y-auto">
          {availableTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <DropdownMenuItem
                key={tag}
                onClick={(e) => {
                  e.preventDefault();
                  handleTagToggle(tag);
                }}
                className={cn(isSelected && "bg-accent")}
              >
                {isSelected && <Check className="mr-2 h-3 w-3" />}
                <span className={cn(!isSelected && "ml-5")}>{tag}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Selected tags badges */}
      {hasSelection && (
        <>
          <div className="flex flex-wrap items-center gap-1">
            {selectedTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs font-normal gap-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        </>
      )}
    </div>
  );
}
