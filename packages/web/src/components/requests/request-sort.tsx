// ADR: ADR-011-web-api-architecture
"use client";

import { Calendar, ArrowDownAZ, ArrowUpAZ, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Sort field options
 */
export type RequestSortField = "date" | "status";

/**
 * Sort direction
 */
export type SortDirection = "asc" | "desc";

/**
 * Sort state for requests
 */
export interface RequestSortState {
  field: RequestSortField;
  direction: SortDirection;
}

interface RequestSortProps {
  sort: RequestSortState;
  onSortChange: (sort: RequestSortState) => void;
  className?: string;
}

/**
 * Sort option configuration
 */
interface SortOption {
  field: RequestSortField;
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
    field: "status",
    direction: "asc",
    label: "Status A-Z",
    icon: <ArrowDownAZ className="h-4 w-4" />,
  },
  {
    field: "status",
    direction: "desc",
    label: "Status Z-A",
    icon: <ArrowUpAZ className="h-4 w-4" />,
  },
];

/**
 * Get the current sort option label
 */
function getCurrentSortLabel(sort: RequestSortState): string {
  const option = sortOptions.find(
    (o) => o.field === sort.field && o.direction === sort.direction
  );
  return option?.label ?? "Sort";
}

/**
 * RequestSort provides sort controls for the request list.
 * Supports sorting by date and status in ascending or descending order.
 */
export function RequestSort({ sort, onSortChange, className }: RequestSortProps) {
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
