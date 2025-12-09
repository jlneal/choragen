// ADR: ADR-011-web-api-architecture
"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { ChainType } from "./chain-card";

/**
 * Filter status options for chains
 * Using a subset of ChainStatus that makes sense for filtering
 */
export type FilterStatus = "todo" | "in-progress" | "done";

/**
 * Filter state for chains
 */
export interface ChainFilterState {
  status: FilterStatus | null;
  type: ChainType | null;
}

interface ChainFiltersProps {
  filters: ChainFilterState;
  onFiltersChange: (filters: ChainFilterState) => void;
  className?: string;
}

/**
 * Status filter options with labels
 */
const statusOptions: { value: FilterStatus; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in-progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

/**
 * Type filter options with labels
 */
const typeOptions: { value: ChainType; label: string }[] = [
  { value: "design", label: "Design" },
  { value: "implementation", label: "Implementation" },
];

/**
 * ChainFilters provides filter controls for the chain list.
 * Supports filtering by status (todo, in-progress, done) and type (design, implementation).
 */
export function ChainFilters({
  filters,
  onFiltersChange,
  className,
}: ChainFiltersProps) {
  const hasActiveFilters = filters.status !== null || filters.type !== null;

  const handleStatusChange = (status: FilterStatus) => {
    onFiltersChange({
      ...filters,
      status: filters.status === status ? null : status,
    });
  };

  const handleTypeChange = (type: ChainType) => {
    onFiltersChange({
      ...filters,
      type: filters.type === type ? null : type,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({ status: null, type: null });
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      {/* Status filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Status:</span>
        <div className="flex gap-1">
          {statusOptions.map((option) => (
            <Button
              key={option.value}
              variant={filters.status === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusChange(option.value)}
              className="h-7 px-2.5 text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Type:</span>
        <div className="flex gap-1">
          {typeOptions.map((option) => (
            <Button
              key={option.value}
              variant={filters.type === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleTypeChange(option.value)}
              className="h-7 px-2.5 text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="mr-1 h-3 w-3" />
          Clear filters
        </Button>
      )}

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 ml-auto">
          {filters.status && (
            <Badge variant="secondary" className="text-xs">
              {statusOptions.find((o) => o.value === filters.status)?.label}
            </Badge>
          )}
          {filters.type && (
            <Badge variant="secondary" className="text-xs">
              {typeOptions.find((o) => o.value === filters.type)?.label}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
