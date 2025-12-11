// ADR: ADR-011-web-api-architecture
"use client";

import { AlertCircle, RefreshCcw, WifiOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ErrorMessageVariant = "network" | "api" | "general";

interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: ErrorMessageVariant;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
  autoRetry?: boolean;
  className?: string;
}

const VARIANT_TITLES: Record<ErrorMessageVariant, string> = {
  network: "Connection lost",
  api: "Something went wrong",
  general: "Something went wrong",
};

const VARIANT_ICON: Record<ErrorMessageVariant, typeof AlertCircle> = {
  network: WifiOff,
  api: AlertCircle,
  general: AlertCircle,
};

export function ErrorMessage({
  title,
  message,
  variant = "general",
  onRetry,
  onDismiss,
  retryLabel = "Retry",
  isRetrying = false,
  autoRetry = false,
  className,
}: ErrorMessageProps) {
  const Icon = VARIANT_ICON[variant];
  const resolvedTitle = title ?? VARIANT_TITLES[variant];

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm shadow-sm",
        className
      )}
      role="status"
    >
      <div className="mt-0.5 rounded-full bg-destructive/10 p-2 text-destructive">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">{resolvedTitle}</p>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          {onDismiss ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={onDismiss}
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
        {(onRetry || autoRetry) && (
          <div className="flex flex-wrap items-center gap-2">
            {onRetry ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                disabled={isRetrying}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                {isRetrying ? "Retrying..." : retryLabel}
              </Button>
            ) : null}
            {autoRetry ? (
              <span className="text-xs text-muted-foreground">
                We&apos;ll retry automatically.
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
