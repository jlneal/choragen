// ADR: ADR-004-pipeline-metrics

/**
 * Metrics export command - export metrics data for external analysis
 */

import {
  MetricsCollector,
  type PipelineEvent,
} from "@choragen/core";
import { getMetricsSummary, type MetricsSummary } from "./metrics-summary.js";
import * as fs from "node:fs/promises";

/**
 * Options for the metrics export command
 */
export interface MetricsExportOptions {
  /** Output format: json or csv */
  format: "json" | "csv";
  /** Output file path (undefined = stdout) */
  output?: string;
  /** Time window filter (e.g., "7d", "30d", "90d") */
  since?: string;
}

/**
 * JSON export structure
 */
export interface MetricsExportJson {
  /** Export timestamp */
  exportedAt: string;
  /** Time period covered */
  period: {
    since: string | null;
    until: string;
  };
  /** Summary metrics */
  summary: {
    tasks: {
      completed: number;
      avgCycleTimeMs: number;
    };
    quality: {
      reworkRate: number;
      firstTimeRight: number;
    };
    tokens: {
      totalInput: number;
      totalOutput: number;
    };
  };
  /** Raw events */
  events: PipelineEvent[];
}

/**
 * CSV column headers
 */
const CSV_HEADERS = [
  "id",
  "timestamp",
  "eventType",
  "entityType",
  "entityId",
  "chainId",
  "requestId",
  "model",
  "tokensInput",
  "tokensOutput",
];

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
 * Escape a CSV field value
 */
function escapeCsvField(value: string | number | undefined | null): string {
  if (value === undefined || value === null) {
    return "";
  }
  const str = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an event to a CSV row
 */
function eventToCsvRow(event: PipelineEvent): string {
  const fields = [
    event.id,
    event.timestamp,
    event.eventType,
    event.entityType,
    event.entityId,
    event.chainId ?? "",
    event.requestId ?? "",
    event.model ?? "",
    event.tokens?.input ?? "",
    event.tokens?.output ?? "",
  ];
  return fields.map(escapeCsvField).join(",");
}

/**
 * Export metrics data
 */
export async function exportMetrics(
  projectRoot: string,
  options: MetricsExportOptions
): Promise<string> {
  const collector = new MetricsCollector(projectRoot);
  const now = new Date();

  // Parse since option
  let sinceDate: Date | undefined;
  if (options.since) {
    sinceDate = parseDuration(options.since);
  }

  // Get events with filtering
  const events = await collector.getEvents({
    since: sinceDate,
  });

  if (options.format === "json") {
    return exportJson(projectRoot, events, sinceDate, now, options.since);
  } else {
    return exportCsv(events);
  }
}

/**
 * Export as JSON format
 */
async function exportJson(
  projectRoot: string,
  events: PipelineEvent[],
  sinceDate: Date | undefined,
  now: Date,
  sinceDuration?: string
): Promise<string> {
  // Get summary metrics using existing function
  const summary: MetricsSummary = await getMetricsSummary(projectRoot, {
    since: sinceDuration,
  });

  const exportData: MetricsExportJson = {
    exportedAt: now.toISOString(),
    period: {
      since: sinceDate?.toISOString() ?? null,
      until: now.toISOString(),
    },
    summary: {
      tasks: {
        completed: summary.tasks.completedTasks,
        avgCycleTimeMs: summary.tasks.avgCycleTimeMs,
      },
      quality: {
        reworkRate: summary.quality.reworkRate,
        firstTimeRight: summary.quality.firstTimeRightRate,
      },
      tokens: {
        totalInput: summary.tokens.totalInput,
        totalOutput: summary.tokens.totalOutput,
      },
    },
    events,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export as CSV format
 */
function exportCsv(events: PipelineEvent[]): string {
  const lines: string[] = [CSV_HEADERS.join(",")];

  for (const event of events) {
    lines.push(eventToCsvRow(event));
  }

  return lines.join("\n");
}

/**
 * Write export to file or stdout
 */
export async function writeExport(
  content: string,
  outputPath?: string
): Promise<void> {
  if (outputPath) {
    await fs.writeFile(outputPath, content, "utf-8");
  } else {
    process.stdout.write(content);
    // Add trailing newline for stdout
    if (!content.endsWith("\n")) {
      process.stdout.write("\n");
    }
  }
}
