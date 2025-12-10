// ADR: ADR-011-web-api-architecture
"use client";

import { Calendar, Files, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Sort field options for sessions
 */
export type SessionSortField = "date" | "files";

/**
 * Sort direction
 */
export type SortDirection = "asc" | "desc";

/**
 * Sort state for sessions
 */
export interface SessionSortState {
  field: SessionSortField;
  direction: SortDirection;
}

interface SessionSortProps {
  sort: SessionSortState;
  onSortChange: (sort: SessionSortState) => void;
  className?: string;
}

/**
 * Sort option configuration
 */
interface SortOption {
  field: SessionSortField;
  direction: SortDirection;
  label: string;
  icon: React.ReactNode;
}

/**
 * Available sort options
 */
const sortOptions: SortOption[] = [
  {
    field: "date",
    direction: "desc",
    label: "Newest first",
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    field: "date",
    direction: "asc",
    label: "Oldest first",
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    field: "files",
    direction: "desc",
    label: "Most files",
    icon: <Files className="h-4 w-4" />,
  },
  {
    field: "files",
    direction: "asc",
    label: "Fewest files",
    icon: <Files className="h-4 w-4" />,
  },
];

/**
 * Get the current sort option label
 */
function getCurrentSortLabel(sort: SessionSortState): string {
  const option = sortOptions.find(
    (o) => o.field === sort.field && o.direction === sort.direction
  );
  return option?.label ?? "Sort";
}

/**
 * SessionSort provides sort controls for the session list.
 * Supports sorting by date and files count in ascending or descending order.
 */
export function SessionSort({ sort, onSortChange, className }: SessionSortProps) {
  const handleSortChange = (option: SortOption) => {
    onSortChange({ field: option.field, direction: option.direction });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-8", className)}>
          {getCurrentSortLabel(sort)}
          <ChevronDown className="ml-1 h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {sortOptions.map((option) => {
          const isActive =
            sort.field === option.field && sort.direction === option.direction;
          return (
            <DropdownMenuItem
              key={`${option.field}-${option.direction}`}
              onClick={() => handleSortChange(option)}
              className={cn(isActive && "bg-accent")}
            >
              {option.icon}
              <span className="ml-2">{option.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
