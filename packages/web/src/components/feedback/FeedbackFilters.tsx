// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/agent-feedback.md
"use client";

import type {
  FeedbackPriority,
  FeedbackStatus,
  FeedbackType,
} from "@choragen/core";

// Client-safe copies of constants from @choragen/core
// (Cannot import runtime values from @choragen/core in client components)
const FEEDBACK_STATUSES: readonly FeedbackStatus[] = [
  "pending",
  "acknowledged",
  "resolved",
  "dismissed",
] as const;

const FEEDBACK_TYPES: readonly FeedbackType[] = [
  "clarification",
  "question",
  "idea",
  "blocker",
  "review",
  "audit",
] as const;

const FEEDBACK_PRIORITIES: readonly FeedbackPriority[] = [
  "low",
  "medium",
  "high",
  "critical",
] as const;
import { Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export type FeedbackSortOption = "date_desc" | "priority" | "type";

interface FeedbackFiltersProps {
  status?: FeedbackStatus;
  type?: FeedbackType;
  priority?: FeedbackPriority;
  sort: FeedbackSortOption;
  onStatusChange: (status?: FeedbackStatus) => void;
  onTypeChange: (type?: FeedbackType) => void;
  onPriorityChange: (priority?: FeedbackPriority) => void;
  onSortChange: (sort: FeedbackSortOption) => void;
  onReset: () => void;
}

export function FeedbackFilters({
  status,
  type,
  priority,
  sort,
  onStatusChange,
  onTypeChange,
  onPriorityChange,
  onSortChange,
  onReset,
}: FeedbackFiltersProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Filter className="h-4 w-4 text-muted-foreground" />
          Filters
        </div>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <FilterSelect
          label="Status"
          value={status}
          onChange={(value) => onStatusChange(value as FeedbackStatus | undefined)}
          items={FEEDBACK_STATUSES}
          placeholder="All"
        />
        <FilterSelect
          label="Type"
          value={type}
          onChange={(value) => onTypeChange(value as FeedbackType | undefined)}
          items={FEEDBACK_TYPES}
          placeholder="All"
        />
        <FilterSelect
          label="Priority"
          value={priority}
          onChange={(value) => onPriorityChange(value as FeedbackPriority | undefined)}
          items={FEEDBACK_PRIORITIES}
          placeholder="All"
        />
      </div>
      <Separator />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Sort by</Label>
          <Select
            value={sort}
            onValueChange={(value) => onSortChange(value as FeedbackSortOption)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Newest first</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value?: string;
  onChange: (value?: string) => void;
  items: readonly string[];
  placeholder: string;
}

function FilterSelect({ label, value, onChange, items, placeholder }: FilterSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select
        value={value ?? "all"}
        onValueChange={(next) => onChange(next === "all" ? undefined : next)}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{placeholder}</SelectItem>
          {items.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
