// ADR: ADR-011-web-api-architecture

/**
 * Metrics tRPC Router
 *
 * Exposes pipeline metrics from MetricsCollector for the web dashboard.
 * Provides queries for events, task metrics, chain metrics, and rework metrics.
 */
import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import {
  MetricsCollector,
  type EventFilter,
  type MetricsOptions,
  type PipelineEvent,
  type TaskMetrics,
  type ChainMetrics,
  type ReworkMetrics,
} from "@choragen/core";

/**
 * Zod schema for event filters
 */
const eventFilterSchema = z
  .object({
    since: z.coerce.date().optional(),
    until: z.coerce.date().optional(),
    chainId: z.string().optional(),
    requestId: z.string().optional(),
  })
  .optional();

/**
 * Zod schema for metrics options
 */
const metricsOptionsSchema = z
  .object({
    since: z.coerce.date().optional(),
    chainId: z.string().optional(),
  })
  .optional();

/**
 * Helper to create a MetricsCollector instance from context
 */
function getMetricsCollector(projectRoot: string): MetricsCollector {
  return new MetricsCollector(projectRoot);
}

/**
 * Convert Zod-parsed filter to EventFilter
 */
function toEventFilter(
  input: z.infer<typeof eventFilterSchema>
): EventFilter | undefined {
  if (!input) return undefined;
  return {
    since: input.since,
    until: input.until,
    chainId: input.chainId,
    requestId: input.requestId,
  };
}

/**
 * Convert Zod-parsed options to MetricsOptions
 */
function toMetricsOptions(
  input: z.infer<typeof metricsOptionsSchema>
): MetricsOptions | undefined {
  if (!input) return undefined;
  return {
    since: input.since,
    chainId: input.chainId,
  };
}

/**
 * Combined summary of all metrics
 */
interface MetricsSummary {
  tasks: TaskMetrics;
  chains: ChainMetrics;
  rework: ReworkMetrics;
  eventCount: number;
}

/**
 * Metrics router for pipeline metrics queries
 */
export const metricsRouter = router({
  /**
   * Get pipeline events with optional filtering
   */
  getEvents: publicProcedure
    .input(eventFilterSchema)
    .query(async ({ ctx, input }): Promise<PipelineEvent[]> => {
      const collector = getMetricsCollector(ctx.projectRoot);
      return collector.getEvents(toEventFilter(input));
    }),

  /**
   * Get task-level metrics (cycle times, completion rates)
   */
  getTaskMetrics: publicProcedure
    .input(metricsOptionsSchema)
    .query(async ({ ctx, input }): Promise<TaskMetrics> => {
      const collector = getMetricsCollector(ctx.projectRoot);
      return collector.getTaskMetrics(toMetricsOptions(input));
    }),

  /**
   * Get chain-level metrics (counts, average tasks per chain)
   */
  getChainMetrics: publicProcedure
    .input(metricsOptionsSchema)
    .query(async ({ ctx, input }): Promise<ChainMetrics> => {
      const collector = getMetricsCollector(ctx.projectRoot);
      return collector.getChainMetrics(toMetricsOptions(input));
    }),

  /**
   * Get rework metrics (rework rates, first-time-right rates)
   */
  getReworkMetrics: publicProcedure
    .input(metricsOptionsSchema)
    .query(async ({ ctx, input }): Promise<ReworkMetrics> => {
      const collector = getMetricsCollector(ctx.projectRoot);
      return collector.getReworkMetrics(toMetricsOptions(input));
    }),

  /**
   * Get combined summary of all metrics
   */
  getSummary: publicProcedure
    .input(metricsOptionsSchema)
    .query(async ({ ctx, input }): Promise<MetricsSummary> => {
      const collector = getMetricsCollector(ctx.projectRoot);
      const options = toMetricsOptions(input);

      const [tasks, chains, rework, events] = await Promise.all([
        collector.getTaskMetrics(options),
        collector.getChainMetrics(options),
        collector.getReworkMetrics(options),
        collector.getEvents(options ? { since: options.since, chainId: options.chainId } : undefined),
      ]);

      return {
        tasks,
        chains,
        rework,
        eventCount: events.length,
      };
    }),
});
