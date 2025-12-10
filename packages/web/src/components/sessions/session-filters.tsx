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

import type { SessionStatus } from "./session-status-badge";

/**
 * Agent role options
 */
export type AgentRole = "impl" | "control";

/**
 * Filter state for sessions
 */
export interface SessionFilterState {
  status: SessionStatus | null;
  agent: AgentRole | null;
}

interface SessionFiltersProps {
  filters: SessionFilterState;
  onFiltersChange: (filters: SessionFilterState) => void;
  className?: string;
}

/**
 * Status filter options with labels
 */
const statusOptions: { value: SessionStatus; label: string }[] = [
  { value: "running", label: "Running" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

/**
 * Agent role filter options
 */
const agentOptions: { value: AgentRole; label: string }[] = [
  { value: "impl", label: "Impl" },
  { value: "control", label: "Control" },
];

/**
 * SessionFilters provides filter controls for the session list.
 * Supports filtering by status and agent role.
 */
export function SessionFilters({
  filters,
  onFiltersChange,
  className,
}: SessionFiltersProps) {
  const hasActiveFilters = filters.status !== null || filters.agent !== null;

  const handleStatusChange = (status: SessionStatus) => {
    onFiltersChange({
      ...filters,
      status: filters.status === status ? null : status,
    });
  };

  const handleAgentChange = (agent: string) => {
    onFiltersChange({
      ...filters,
      agent: agent === "all" ? null : (agent as AgentRole),
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({ status: null, agent: null });
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

      {/* Agent role filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Agent:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 w-[100px] text-xs justify-between">
              {filters.agent ? agentOptions.find((o) => o.value === filters.agent)?.label : "All agents"}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[100px]">
            <DropdownMenuItem
              onClick={() => handleAgentChange("all")}
              className={cn(!filters.agent && "bg-accent")}
            >
              {!filters.agent && <Check className="mr-2 h-3 w-3" />}
              <span className={cn(filters.agent && "ml-5")}>All agents</span>
            </DropdownMenuItem>
            {agentOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleAgentChange(option.value)}
                className={cn(filters.agent === option.value && "bg-accent")}
              >
                {filters.agent === option.value && <Check className="mr-2 h-3 w-3" />}
                <span className={cn(filters.agent !== option.value && "ml-5")}>{option.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
          {filters.agent && (
            <Badge variant="secondary" className="text-xs">
              {agentOptions.find((o) => o.value === filters.agent)?.label}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
