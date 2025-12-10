// ADR: ADR-011-web-api-architecture
"use client";

import { X, ChevronDown, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import type { RequestStatus } from "./request-status-badge";

/**
 * Filter state for requests
 */
export interface RequestFilterState {
  status: RequestStatus | null;
  domain: string | null;
}

interface RequestFiltersProps {
  filters: RequestFilterState;
  onFiltersChange: (filters: RequestFilterState) => void;
  /** Available domains extracted from requests */
  availableDomains: string[];
  className?: string;
}

/**
 * Status filter options with labels
 */
const statusOptions: { value: RequestStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "Todo" },
  { value: "doing", label: "In Progress" },
  { value: "done", label: "Done" },
];

/**
 * RequestFilters provides filter controls for the request list.
 * Supports filtering by status (todo, doing, done) and domain.
 */
export function RequestFilters({
  filters,
  onFiltersChange,
  availableDomains,
  className,
}: RequestFiltersProps) {
  const hasActiveFilters = filters.status !== null || filters.domain !== null;

  const handleStatusChange = (status: RequestStatus) => {
    onFiltersChange({
      ...filters,
      status: filters.status === status ? null : status,
    });
  };

  const handleDomainChange = (domain: string) => {
    onFiltersChange({
      ...filters,
      domain: domain === "all" ? null : domain,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({ status: null, domain: null });
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

      {/* Domain filter */}
      {availableDomains.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Domain:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 w-[120px] text-xs justify-between">
                {filters.domain ?? "All domains"}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[120px]">
              <DropdownMenuItem
                onClick={() => handleDomainChange("all")}
                className={cn(!filters.domain && "bg-accent")}
              >
                {!filters.domain && <Check className="mr-2 h-3 w-3" />}
                <span className={cn(filters.domain && "ml-5")}>All domains</span>
              </DropdownMenuItem>
              {availableDomains.map((domain) => (
                <DropdownMenuItem
                  key={domain}
                  onClick={() => handleDomainChange(domain)}
                  className={cn(filters.domain === domain && "bg-accent")}
                >
                  {filters.domain === domain && <Check className="mr-2 h-3 w-3" />}
                  <span className={cn(filters.domain !== domain && "ml-5")}>{domain}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

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
          {filters.domain && (
            <Badge variant="secondary" className="text-xs">
              {filters.domain}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
