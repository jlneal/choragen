// ADR: ADR-011-web-api-architecture
"use client";

export const dynamic = "force-dynamic";

import {
  CheckCircle2,
  Clock,
  RefreshCcw,
  Link2,
  DollarSign,
  Zap,
} from "lucide-react";

import { useTimeRange, useMetrics } from "@/hooks";
import {
  MetricCard,
  MetricCardSkeleton,
  TimeRangeFilter,
  TaskCompletionChart,
  ReworkTrendChart,
  ChartSkeleton,
  SessionsTable,
  SessionsTableSkeleton,
  type SessionData,
} from "@/components/metrics";
import { formatDuration, formatPercentage } from "@/lib/metrics-utils";

/**
 * Placeholder session data until session tracking is implemented.
 * TODO: Replace with actual session data from tRPC when available.
 */
const PLACEHOLDER_SESSIONS: SessionData[] = [
  {
    id: "sess_abc123def456",
    tokens: 15420,
    cost: 0.0462,
    status: "completed",
    date: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
  },
  {
    id: "sess_ghi789jkl012",
    tokens: 8750,
    cost: 0.0263,
    status: "completed",
    date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: "sess_mno345pqr678",
    tokens: 22100,
    cost: 0.0663,
    status: "in_progress",
    date: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
  },
  {
    id: "sess_stu901vwx234",
    tokens: 5200,
    cost: 0.0156,
    status: "failed",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: "sess_yza567bcd890",
    tokens: 12800,
    cost: 0.0384,
    status: "completed",
    date: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
  },
];

/**
 * MetricsPage displays KPI cards and charts for pipeline metrics.
 *
 * Uses tRPC to fetch metrics summary and events, with time range filtering.
 */
export default function MetricsPage() {
  const { range, since, setRange } = useTimeRange("30d");
  const { summary, taskCompletionData, reworkTrendData, isLoading } =
    useMetrics(since);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Metrics</h1>
          <p className="text-muted-foreground">
            Analytics and insights for your development workflows
          </p>
        </div>
        <TimeRangeFilter value={range} onChange={setRange} />
      </div>

      {/* KPI Cards - 3 columns on desktop, 1 on mobile */}
      <div className="grid gap-4 md:grid-cols-3">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            {/* Tasks Completed */}
            <MetricCard
              title="Tasks Completed"
              value={summary?.tasks.completedTasks ?? 0}
              description={`${summary?.tasks.totalTasks ?? 0} total tasks`}
              icon={CheckCircle2}
            />

            {/* Rework Rate */}
            <MetricCard
              title="Rework Rate"
              value={formatPercentage(summary?.rework.reworkRate ?? 0)}
              description={`${summary?.rework.totalReworks ?? 0} rework events`}
              icon={RefreshCcw}
            />

            {/* Avg Cycle Time */}
            <MetricCard
              title="Avg Cycle Time"
              value={formatDuration(summary?.tasks.avgCycleTimeMs ?? 0)}
              description={`P50: ${formatDuration(summary?.tasks.p50CycleTimeMs ?? 0)}, P90: ${formatDuration(summary?.tasks.p90CycleTimeMs ?? 0)}`}
              icon={Clock}
            />

            {/* Chains Completed */}
            <MetricCard
              title="Chains Completed"
              value={summary?.chains.completedChains ?? 0}
              description={`${summary?.chains.totalChains ?? 0} total chains`}
              icon={Link2}
            />

            {/* Total Cost - placeholder */}
            <MetricCard
              title="Total Cost"
              value="—"
              description="Cost tracking coming soon"
              icon={DollarSign}
            />

            {/* Tokens Used - placeholder */}
            <MetricCard
              title="Tokens Used"
              value="—"
              description="Token tracking coming soon"
              icon={Zap}
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <>
            <ChartSkeleton variant="bar" />
            <ChartSkeleton variant="line" />
          </>
        ) : (
          <>
            <TaskCompletionChart
              data={taskCompletionData}
              title="Task Completions"
              description="Tasks completed over time"
            />
            <ReworkTrendChart
              data={reworkTrendData}
              title="Rework Rate"
              description="Percentage of tasks requiring rework"
            />
          </>
        )}
      </div>

      {/* Sessions Table */}
      {isLoading ? (
        <SessionsTableSkeleton rows={5} />
      ) : (
        <SessionsTable
          sessions={PLACEHOLDER_SESSIONS}
          title="Recent Sessions"
          description="Agent sessions from the selected time period"
        />
      )}
    </div>
  );
}
