// ADR: ADR-011-web-api-architecture
"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Tab options for request list
 */
export type RequestTab = "all" | "change-request" | "fix-request";

interface RequestTabsProps {
  activeTab: RequestTab;
  onTabChange: (tab: RequestTab) => void;
  className?: string;
}

/**
 * Tab configuration with labels
 */
const tabOptions: { value: RequestTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "change-request", label: "Change Requests" },
  { value: "fix-request", label: "Fix Requests" },
];

/**
 * RequestTabs provides tab navigation for switching between All, CR, and FR views.
 */
export function RequestTabs({
  activeTab,
  onTabChange,
  className,
}: RequestTabsProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 bg-muted rounded-lg", className)}>
      {tabOptions.map((tab) => (
        <Button
          key={tab.value}
          variant={activeTab === tab.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onTabChange(tab.value)}
          className={cn(
            "h-8 px-3 text-sm",
            activeTab === tab.value
              ? "shadow-sm"
              : "hover:bg-transparent hover:text-foreground"
          )}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
