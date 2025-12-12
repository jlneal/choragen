// ADR: ADR-011-web-api-architecture
"use client";

import { AlertCircle, RefreshCcw, WifiOff, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ErrorMessageVariant = "network" | "api" | "general";
export type AgentErrorType =
  | "api_key"
  | "rate_limit"
  | "network"
  | "agent_crash"
  | "timeout"
  | "general";

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

interface AgentErrorMessageProps {
  error: {
    type: AgentErrorType;
    message: string;
  };
  onRetry: () => void;
  isRetrying?: boolean;
  onDismiss?: () => void;
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

function getAgentErrorTitle(type: AgentErrorType): string {
  switch (type) {
    case "api_key":
      return "Provider not configured";
    case "rate_limit":
      return "Rate limited";
    case "network":
      return "Network issue";
    case "agent_crash":
      return "Agent crashed";
    case "timeout":
      return "Agent timed out";
    default:
      return "Agent error";
  }
}

export function AgentErrorMessage({ error, onRetry, isRetrying, onDismiss }: AgentErrorMessageProps) {
  const title = getAgentErrorTitle(error.type);
  const showSettingsLink = error.type === "api_key";

  return (
    <div className="flex flex-col gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="font-semibold text-destructive">{title}</p>
          <p className="text-muted-foreground">{error.message}</p>
          {showSettingsLink ? (
            <Link href="/settings" className="text-xs font-medium text-primary underline">
              Configure API key in Settings
            </Link>
          ) : null}
        </div>
        {onDismiss ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={onDismiss}
            aria-label="Dismiss agent error"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          {isRetrying ? "Retrying..." : "Retry"}
        </Button>
        {error.type === "rate_limit" ? (
          <span className="text-xs text-muted-foreground">Please wait a moment before retrying.</span>
        ) : null}
      </div>
    </div>
  );
}
