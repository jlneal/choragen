// ADR: ADR-011-web-api-architecture

import type { ComponentType } from "react";
import { Circle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProviderCardProps {
  name: string;
  description: string;
  configured: boolean;
  icon: ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

export function ProviderCard({
  name,
  description,
  configured,
  icon: Icon,
  children,
}: ProviderCardProps) {
  return (
    <Card className="flex flex-col gap-2 border-muted/60 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="h-5 w-5 text-primary" />
            {name}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
            configured
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Circle
            className={cn(
              "h-3 w-3",
              configured ? "fill-emerald-500 text-emerald-500" : "text-muted-foreground"
            )}
          />
          {configured ? "Configured" : "Not configured"}
        </span>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
