// ADR: ADR-011-web-api-architecture

import { Info, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ToolRole {
  id: string;
  name: string;
}

interface ToolCardProps {
  id: string;
  name: string;
  description?: string;
  category?: string;
  mutates: boolean;
  roles: ToolRole[];
  className?: string;
}

export function ToolCard({
  id,
  name,
  description,
  category,
  mutates,
  roles,
  className,
}: ToolCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg leading-tight">{name}</CardTitle>
            <CardDescription className="font-mono text-xs">{id}</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-sm text-sm">
                {description || "No description provided"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {category && <Badge variant="secondary">{category}</Badge>}
          {mutates && (
            <Badge variant="destructive" className="gap-1">
              <Wrench className="h-3.5 w-3.5" />
              Mutates
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Roles with access
          </p>
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles currently include this tool.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Badge key={role.id} variant="outline" className="gap-1">
                  <span className="font-medium">{role.name}</span>
                  <span className="text-xs text-muted-foreground">({role.id})</span>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ToolCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}
