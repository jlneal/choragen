// ADR: ADR-011-web-api-architecture
"use client";

import { ArrowDownAZ, ArrowUpAZ, Calendar, TrendingUp, ChevronDown } from "lucide-react";

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
export type SortField = "date" | "progress" | "name";

/**
 * Sort direction
 */
export type SortDirection = "asc" | "desc";

/**
 * Sort state for chains
 */
export interface ChainSortState {
  field: SortField;
  direction: SortDirection;
}

interface ChainSortProps {
  sort: ChainSortState;
  onSortChange: (sort: ChainSortState) => void;
  className?: string;
}

/**
 * Sort option configuration
 */
interface SortOption {
  field: SortField;
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
    field: "progress",
    direction: "desc",
    label: "Most progress",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    field: "progress",
    direction: "asc",
    label: "Least progress",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {
    field: "name",
    direction: "asc",
    label: "Name A-Z",
    icon: <ArrowDownAZ className="h-4 w-4" />,
  },
  {
    field: "name",
    direction: "desc",
    label: "Name Z-A",
    icon: <ArrowUpAZ className="h-4 w-4" />,
  },
];

/**
 * Get the current sort option label
 */
function getCurrentSortLabel(sort: ChainSortState): string {
  const option = sortOptions.find(
    (o) => o.field === sort.field && o.direction === sort.direction
  );
  return option?.label ?? "Sort";
}

/**
 * ChainSort provides sort controls for the chain list.
 * Supports sorting by date, progress, and name in ascending or descending order.
 */
export function ChainSort({ sort, onSortChange, className }: ChainSortProps) {
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
