// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProviderRequiredBannerProps {
  className?: string;
  onRefresh?: () => void;
  message?: string;
}

export function ProviderRequiredBanner({
  className,
  onRefresh,
  message = "No LLM provider configured. Add a key to continue.",
}: ProviderRequiredBannerProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-[2px] h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">Provider required</p>
          <p className="text-sm text-amber-900/80 dark:text-amber-100/80">
            {message}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="secondary" className="min-h-[36px]">
          <Link href="/settings">Go to Settings</Link>
        </Button>
        {onRefresh ? (
          <Button
            size="sm"
            variant="outline"
            className="min-h-[36px]"
            onClick={onRefresh}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh status
          </Button>
        ) : null}
      </div>
    </div>
  );
}
