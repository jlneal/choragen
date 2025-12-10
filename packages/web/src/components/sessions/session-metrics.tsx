// ADR: ADR-011-web-api-architecture

import { User, Files, Clock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SessionMetricsProps {
  /** Agent role (impl/control) */
  agent: string;
  /** Number of files locked */
  filesCount: number;
  /** Session duration in minutes */
  durationMinutes: number;
}

/**
 * Format duration for display
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Single metric card component
 */
function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-muted p-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * SessionMetrics displays key metrics for a session in a grid layout.
 * Shows agent role, files count, and session duration.
 */
export function SessionMetrics({
  agent,
  filesCount,
  durationMinutes,
}: SessionMetricsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <MetricCard
        icon={User}
        label="Agent Role"
        value={agent.charAt(0).toUpperCase() + agent.slice(1)}
      />
      <MetricCard
        icon={Files}
        label="Locked Files"
        value={filesCount.toString()}
      />
      <MetricCard
        icon={Clock}
        label="Duration"
        value={formatDuration(durationMinutes)}
      />
    </div>
  );
}

/**
 * Loading skeleton for SessionMetrics
 */
export function SessionMetricsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
