/**
 * MetricsCollector - Records and queries pipeline events
 *
 * Stores events in append-only JSONL format for analysis.
 *
 * ADR: ADR-004-pipeline-metrics
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import {
  type PipelineEvent,
  type EventType,
  EVENTS_LOG_PATH,
  METRICS_DIR,
} from "./types.js";

/**
 * Filter options for querying events
 */
export interface EventFilter {
  /** Only events after this date */
  since?: Date;
  /** Only events before this date */
  until?: Date;
  /** Filter by event type(s) */
  eventType?: EventType | EventType[];
  /** Filter by chain ID */
  chainId?: string;
  /** Filter by request ID */
  requestId?: string;
}

/**
 * Options for aggregation methods
 */
export interface MetricsOptions {
  /** Only events after this date */
  since?: Date;
  /** Filter by chain ID */
  chainId?: string;
}

/**
 * Task-level metrics
 */
export interface TaskMetrics {
  /** Total number of tasks */
  totalTasks: number;
  /** Number of completed tasks */
  completedTasks: number;
  /** Average cycle time in milliseconds */
  avgCycleTimeMs: number;
  /** 50th percentile cycle time in milliseconds */
  p50CycleTimeMs: number;
  /** 90th percentile cycle time in milliseconds */
  p90CycleTimeMs: number;
}

/**
 * Chain-level metrics
 */
export interface ChainMetrics {
  /** Total number of chains */
  totalChains: number;
  /** Number of completed chains */
  completedChains: number;
  /** Average tasks per chain */
  avgTasksPerChain: number;
}

/**
 * Rework metrics
 */
export interface ReworkMetrics {
  /** Total number of rework events */
  totalReworks: number;
  /** Rework rate (0-1) */
  reworkRate: number;
  /** First-time-right rate (0-1) */
  firstTimeRightRate: number;
  /** Average rework iterations per task */
  avgReworkIterations: number;
}

/**
 * MetricsCollector class for recording and querying pipeline events
 */
export class MetricsCollector {
  private readonly projectRoot: string;
  private readonly eventsLogPath: string;
  private readonly metricsDir: string;

  /**
   * Create a new MetricsCollector
   * @param projectRoot - Root directory of the project
   */
  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.eventsLogPath = path.join(projectRoot, EVENTS_LOG_PATH);
    this.metricsDir = path.join(projectRoot, METRICS_DIR);
  }

  /**
   * Record a new pipeline event
   * @param event - Event data (id and timestamp will be auto-generated)
   */
  async record(
    event: Omit<PipelineEvent, "id" | "timestamp">
  ): Promise<PipelineEvent> {
    await this.ensureMetricsDir();

    const fullEvent: PipelineEvent = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ...event,
    };

    const line = JSON.stringify(fullEvent) + "\n";
    await fs.appendFile(this.eventsLogPath, line, "utf-8");

    return fullEvent;
  }

  /**
   * Get events with optional filtering
   * @param filter - Optional filter criteria
   */
  async getEvents(filter?: EventFilter): Promise<PipelineEvent[]> {
    const events = await this.readAllEvents();
    if (!filter) {
      return events;
    }

    return events.filter((event) => this.matchesFilter(event, filter));
  }

  /**
   * Get task-level metrics
   * @param options - Optional filter options
   */
  async getTaskMetrics(options?: MetricsOptions): Promise<TaskMetrics> {
    const events = await this.getFilteredEvents(options);

    // Group events by task
    const taskEvents = new Map<
      string,
      { started?: PipelineEvent; completed?: PipelineEvent }
    >();

    for (const event of events) {
      if (event.entityType !== "task") continue;

      const existing = taskEvents.get(event.entityId) ?? {};
      if (event.eventType === "task:started") {
        existing.started = event;
      } else if (event.eventType === "task:completed") {
        existing.completed = event;
      }
      taskEvents.set(event.entityId, existing);
    }

    // Calculate cycle times for completed tasks
    const cycleTimes: number[] = [];
    let completedTasks = 0;

    for (const [, task] of taskEvents) {
      if (task.completed) {
        completedTasks++;
        if (task.started) {
          const startTime = new Date(task.started.timestamp).getTime();
          const endTime = new Date(task.completed.timestamp).getTime();
          cycleTimes.push(endTime - startTime);
        }
      }
    }

    // Sort for percentile calculations
    cycleTimes.sort((a, b) => a - b);

    return {
      totalTasks: taskEvents.size,
      completedTasks,
      avgCycleTimeMs: this.average(cycleTimes),
      p50CycleTimeMs: this.percentile(cycleTimes, 50),
      p90CycleTimeMs: this.percentile(cycleTimes, 90),
    };
  }

  /**
   * Get chain-level metrics
   * @param options - Optional filter options
   */
  async getChainMetrics(options?: MetricsOptions): Promise<ChainMetrics> {
    const events = await this.getFilteredEvents(options);

    // Track chains
    const chains = new Map<
      string,
      { created: boolean; completed: boolean; taskCount: number }
    >();

    for (const event of events) {
      if (event.entityType === "chain") {
        const existing = chains.get(event.entityId) ?? {
          created: false,
          completed: false,
          taskCount: 0,
        };
        if (event.eventType === "chain:created") {
          existing.created = true;
        } else if (event.eventType === "chain:completed") {
          existing.completed = true;
        }
        chains.set(event.entityId, existing);
      }

      // Count tasks per chain
      if (
        event.entityType === "task" &&
        event.chainId &&
        event.eventType === "task:started"
      ) {
        const existing = chains.get(event.chainId) ?? {
          created: false,
          completed: false,
          taskCount: 0,
        };
        existing.taskCount++;
        chains.set(event.chainId, existing);
      }
    }

    const totalChains = chains.size;
    let completedChains = 0;
    let totalTasksInChains = 0;

    for (const [, chain] of chains) {
      if (chain.completed) completedChains++;
      totalTasksInChains += chain.taskCount;
    }

    return {
      totalChains,
      completedChains,
      avgTasksPerChain: totalChains > 0 ? totalTasksInChains / totalChains : 0,
    };
  }

  /**
   * Get rework metrics
   * @param options - Optional filter options
   */
  async getReworkMetrics(options?: MetricsOptions): Promise<ReworkMetrics> {
    const events = await this.getFilteredEvents(options);

    // Track rework per task
    const taskReworks = new Map<string, number>();
    const completedTasks = new Set<string>();

    for (const event of events) {
      if (event.entityType !== "task") continue;

      if (event.eventType === "task:rework") {
        const count = taskReworks.get(event.entityId) ?? 0;
        taskReworks.set(event.entityId, count + 1);
      } else if (event.eventType === "task:completed") {
        completedTasks.add(event.entityId);
      }
    }

    const totalReworks = Array.from(taskReworks.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    const tasksWithRework = taskReworks.size;
    const totalCompletedTasks = completedTasks.size;

    // Rework rate: tasks that had rework / total completed tasks
    const reworkRate =
      totalCompletedTasks > 0 ? tasksWithRework / totalCompletedTasks : 0;

    // First-time-right: tasks completed without rework
    const firstTimeRight = totalCompletedTasks - tasksWithRework;
    const firstTimeRightRate =
      totalCompletedTasks > 0 ? firstTimeRight / totalCompletedTasks : 0;

    // Average rework iterations (for tasks that had rework)
    const avgReworkIterations =
      tasksWithRework > 0 ? totalReworks / tasksWithRework : 0;

    return {
      totalReworks,
      reworkRate,
      firstTimeRightRate,
      avgReworkIterations,
    };
  }

  /**
   * Ensure the metrics directory exists
   */
  private async ensureMetricsDir(): Promise<void> {
    try {
      await fs.mkdir(this.metricsDir, { recursive: true });
    } catch {
      // Directory may already exist
    }
  }

  /**
   * Read all events from the JSONL file
   */
  private async readAllEvents(): Promise<PipelineEvent[]> {
    try {
      const content = await fs.readFile(this.eventsLogPath, "utf-8");
      const lines = content.trim().split("\n").filter(Boolean);
      return lines.map((line) => JSON.parse(line) as PipelineEvent);
    } catch (error) {
      // File doesn't exist or is empty
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get events filtered by MetricsOptions
   */
  private async getFilteredEvents(
    options?: MetricsOptions
  ): Promise<PipelineEvent[]> {
    const filter: EventFilter = {};
    if (options?.since) filter.since = options.since;
    if (options?.chainId) filter.chainId = options.chainId;
    return this.getEvents(filter);
  }

  /**
   * Check if an event matches the filter criteria
   */
  private matchesFilter(event: PipelineEvent, filter: EventFilter): boolean {
    if (filter.since) {
      const eventTime = new Date(event.timestamp);
      if (eventTime < filter.since) return false;
    }

    if (filter.until) {
      const eventTime = new Date(event.timestamp);
      if (eventTime > filter.until) return false;
    }

    if (filter.eventType) {
      const types = Array.isArray(filter.eventType)
        ? filter.eventType
        : [filter.eventType];
      if (!types.includes(event.eventType)) return false;
    }

    if (filter.chainId) {
      // Match either the event's chainId field or entityId for chain events
      const matchesChainId =
        event.chainId === filter.chainId ||
        (event.entityType === "chain" && event.entityId === filter.chainId);
      if (!matchesChainId) return false;
    }

    if (filter.requestId) {
      const matchesRequestId =
        event.requestId === filter.requestId ||
        (event.entityType === "request" && event.entityId === filter.requestId);
      if (!matchesRequestId) return false;
    }

    return true;
  }

  /**
   * Calculate average of an array of numbers
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Calculate percentile of a sorted array
   */
  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }
}
