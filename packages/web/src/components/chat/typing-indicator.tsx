// ADR: ADR-011-web-api-architecture
"use client";

import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  alignment?: "left" | "right";
  label?: string;
  role?: "control" | "impl";
  isVisible?: boolean;
  className?: string;
}

export function TypingIndicator({
  alignment = "left",
  label,
  role,
  isVisible = true,
  className,
}: TypingIndicatorProps) {
  if (!isVisible) {
    return null;
  }

  const derivedLabel =
    label ??
    (role === "control"
      ? "Control agent"
      : role === "impl"
        ? "Implementation agent"
        : "Assistant");

  return (
    <div
      className={cn("flex", alignment === "right" ? "justify-end" : "justify-start", className)}
      role="status"
      aria-live="polite"
    >
      <div className="inline-flex items-center gap-3 rounded-full border border-border bg-muted px-4 py-2 text-xs text-muted-foreground shadow-sm">
        <span className="font-medium">{derivedLabel}</span>
        <div className="flex items-end gap-1" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <span
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className="h-2 w-2 rounded-full bg-muted-foreground/80 animate-bounce"
              style={{ animationDelay: `${index * 120}ms` }}
            />
          ))}
        </div>
        <span className="sr-only">{label} is typing</span>
      </div>
    </div>
  );
}
