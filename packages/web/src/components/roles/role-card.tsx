// ADR: ADR-011-web-api-architecture

import Link from "next/link";
import { ArrowRight, CalendarClock, Clock3, Hash, ThermometerSun, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value: Date): string {
  const timestamp = value.getTime();
  if (Number.isNaN(timestamp)) {
    return "Unknown";
  }
  return dateFormatter.format(value);
}

export interface RoleCardProps {
  id: string;
  name: string;
  description?: string;
  toolCount: number;
  createdAt: Date;
  updatedAt: Date;
  temperature?: number;
  className?: string;
}

export function RoleCard({
  id,
  name,
  description,
  toolCount,
  createdAt,
  updatedAt,
  temperature,
  className,
}: RoleCardProps) {
  return (
    <Link
      href={`/roles/${id}`}
      className={cn(
        "group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg",
        className
      )}
    >
      <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-xl font-semibold leading-tight">
              {name}
            </CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
          </div>
          <Badge variant="secondary" className="w-fit gap-1 font-mono text-xs">
            <Hash className="h-3.5 w-3.5" />
            {id}
          </Badge>
          {typeof temperature === "number" && !Number.isNaN(temperature) ? (
            <Badge variant="outline" className="w-fit gap-1 text-xs">
              <ThermometerSun className="h-3.5 w-3.5 text-amber-500" />
              {temperature.toFixed(1)}
            </Badge>
          ) : null}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description ?? "No description provided"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 border-t pt-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <span>{toolCount}</span>
            <span className="text-muted-foreground">tools</span>
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              <div className="leading-tight">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
                  Created
                </p>
                <p className="text-foreground">{formatDate(createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              <div className="leading-tight">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
                  Updated
                </p>
                <p className="text-foreground">{formatDate(updatedAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function RoleCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-4" />
        </div>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent className="space-y-4 border-t pt-4">
        <Skeleton className="h-5 w-24" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
