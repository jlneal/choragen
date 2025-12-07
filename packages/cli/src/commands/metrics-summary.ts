// ADR: ADR-004-pipeline-metrics

/**
 * Metrics summary command - display pipeline metrics
 */

import {
  MetricsCollector,
  type MetricsOptions,
  type TaskMetrics,
  type ChainMetrics,
  type ReworkMetrics,
  type PipelineEvent,
} from "@choragen/core";

/**
 * Options for the metrics summary command
 */
export interface MetricsSummaryOptions {
  /** Time window filter (e.g., "7d", "30d", "90d") */
  since?: string;
  /** Filter to specific chain */
  chainId?: string;
}

/**
 * Token metrics aggregation
 */
export interface TokenMetrics {
  /** Total input tokens */
  totalInput: number;
  /** Total output tokens */
  totalOutput: number;
  /** Average tokens per task */
  avgPerTask: number;
}

/**
 * Model usage metrics
 */
export interface ModelUsage {
  /** Model name */
  model: string;
  /** Number of tasks using this model */
  taskCount: number;
}

/**
 * Request metrics
 */
export interface RequestMetrics {
  /** Total requests closed */
  closedRequests: number;
}

/**
 * Complete metrics summary
 */
export interface MetricsSummary {
  /** Time window description */
  timeWindow: string;
  /** Task-level metrics */
  tasks: TaskMetrics;
  /** Quality/rework metrics */
  quality: ReworkMetrics;
  /** Chain-level metrics */
  chains: ChainMetrics;
  /** Request metrics */
  requests: RequestMetrics;
  /** Token usage metrics */
  tokens: TokenMetrics;
  /** Models used */
  models: ModelUsage[];
}

/**
 * Parse duration string to Date
 * Supports: 7d, 30d, 90d (days)
 */
function parseDuration(duration: string): Date | undefined {
  const match = duration.match(/^(\d+)d$/);
  if (!match) {
    return undefined;
  }
  const days = parseInt(match[1], 10);
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Format milliseconds to human-readable duration
 */
function formatDuration(ms: number): string {
  if (ms === 0) return "N/A";

  const hours = ms / (1000 * 60 * 60);
  if (hours < 1) {
    const minutes = ms / (1000 * 60);
    return `${minutes.toFixed(1)} minutes`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)} hours`;
  }
  const days = hours / 24;
  return `${days.toFixed(1)} days`;
}

/**
 * Format a number with thousands separators
 */
function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/**
 * Format percentage
 */
function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * Get metrics summary from the collector
 */
export async function getMetricsSummary(
  projectRoot: string,
  options: MetricsSummaryOptions = {}
): Promise<MetricsSummary> {
  const collector = new MetricsCollector(projectRoot);

  // Parse since option
  let since: Date | undefined;
  let timeWindow = "all time";
  if (options.since) {
    since = parseDuration(options.since);
    if (since) {
      timeWindow = `last ${options.since}`;
    }
  }

  const metricsOptions: MetricsOptions = {
    since,
    chainId: options.chainId,
  };

  // Get core metrics from collector
  const [taskMetrics, chainMetrics, reworkMetrics, events] = await Promise.all([
    collector.getTaskMetrics(metricsOptions),
    collector.getChainMetrics(metricsOptions),
    collector.getReworkMetrics(metricsOptions),
    collector.getEvents({
      since,
      chainId: options.chainId,
    }),
  ]);

  // Calculate token metrics
  const tokenMetrics = calculateTokenMetrics(events, taskMetrics.completedTasks);

  // Calculate model usage
  const modelUsage = calculateModelUsage(events);

  // Calculate request metrics
  const requestMetrics = calculateRequestMetrics(events);

  return {
    timeWindow,
    tasks: taskMetrics,
    quality: reworkMetrics,
    chains: chainMetrics,
    requests: requestMetrics,
    tokens: tokenMetrics,
    models: modelUsage,
  };
}

/**
 * Calculate token metrics from events
 */
function calculateTokenMetrics(
  events: PipelineEvent[],
  completedTasks: number
): TokenMetrics {
  let totalInput = 0;
  let totalOutput = 0;

  for (const event of events) {
    if (event.tokens) {
      totalInput += event.tokens.input;
      totalOutput += event.tokens.output;
    }
  }

  const totalTokens = totalInput + totalOutput;
  const avgPerTask = completedTasks > 0 ? totalTokens / completedTasks : 0;

  return {
    totalInput,
    totalOutput,
    avgPerTask: Math.round(avgPerTask),
  };
}

/**
 * Calculate model usage from events
 */
function calculateModelUsage(events: PipelineEvent[]): ModelUsage[] {
  const modelCounts = new Map<string, number>();

  for (const event of events) {
    if (event.model && event.eventType === "task:completed") {
      const count = modelCounts.get(event.model) ?? 0;
      modelCounts.set(event.model, count + 1);
    }
  }

  const usage: ModelUsage[] = [];
  for (const [model, taskCount] of modelCounts) {
    usage.push({ model, taskCount });
  }

  // Sort by task count descending
  usage.sort((a, b) => b.taskCount - a.taskCount);

  return usage;
}

/**
 * Calculate request metrics from events
 */
function calculateRequestMetrics(events: PipelineEvent[]): RequestMetrics {
  let closedRequests = 0;

  for (const event of events) {
    if (event.eventType === "request:closed") {
      closedRequests++;
    }
  }

  return { closedRequests };
}

/**
 * Format metrics summary for CLI output
 */
export function formatMetricsSummary(summary: MetricsSummary): string {
  const lines: string[] = [];
  const width = 59;

  lines.push(`Pipeline Metrics (${summary.timeWindow})`);
  lines.push("═".repeat(width));
  lines.push("");

  // Tasks section
  lines.push("Tasks");
  lines.push(`  Completed:        ${summary.tasks.completedTasks}`);
  lines.push(`  Avg Cycle Time:   ${formatDuration(summary.tasks.avgCycleTimeMs)}`);
  lines.push(`  P50 Cycle Time:   ${formatDuration(summary.tasks.p50CycleTimeMs)}`);
  lines.push(`  P90 Cycle Time:   ${formatDuration(summary.tasks.p90CycleTimeMs)}`);
  lines.push("");

  // Quality section
  const reworkCount = summary.quality.totalReworks;
  const completedCount = summary.tasks.completedTasks;
  const reworkDisplay = completedCount > 0
    ? `${formatPercent(summary.quality.reworkRate)} (${reworkCount}/${completedCount})`
    : "N/A";

  lines.push("Quality");
  lines.push(`  Rework Rate:      ${reworkDisplay}`);
  lines.push(`  First-Time-Right: ${completedCount > 0 ? formatPercent(summary.quality.firstTimeRightRate) : "N/A"}`);
  if (summary.quality.avgReworkIterations > 0) {
    lines.push(`  Avg Rework Iterations: ${summary.quality.avgReworkIterations.toFixed(1)}`);
  }
  lines.push("");

  // Chains section
  lines.push("Chains");
  lines.push(`  Completed:        ${summary.chains.completedChains}`);
  lines.push(`  Active:           ${summary.chains.totalChains - summary.chains.completedChains}`);
  if (summary.chains.avgTasksPerChain > 0) {
    lines.push(`  Avg Tasks/Chain:  ${summary.chains.avgTasksPerChain.toFixed(1)}`);
  }
  lines.push("");

  // Requests section
  lines.push("Requests");
  lines.push(`  Closed:           ${summary.requests.closedRequests}`);
  lines.push("");

  // Tokens section (only if there's data)
  if (summary.tokens.totalInput > 0 || summary.tokens.totalOutput > 0) {
    lines.push("Tokens (where tracked)");
    lines.push(`  Total Input:      ${formatNumber(summary.tokens.totalInput)}`);
    lines.push(`  Total Output:     ${formatNumber(summary.tokens.totalOutput)}`);
    lines.push(`  Avg per Task:     ${formatNumber(summary.tokens.avgPerTask)}`);
    lines.push("");
  }

  // Models section (only if there's data)
  if (summary.models.length > 0) {
    lines.push("Models Used");
    for (const model of summary.models) {
      const modelName = model.model.padEnd(20);
      lines.push(`  ${modelName} ${model.taskCount} tasks`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Format metrics summary as JSON
 */
export function formatMetricsSummaryJson(summary: MetricsSummary): string {
  return JSON.stringify(summary, null, 2);
}
