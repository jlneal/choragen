/**
 * @design-doc docs/design/core/features/pipeline-metrics.md
 * @user-intent "Verify MetricsCollector correctly records, queries, and aggregates pipeline events for task and rework metrics"
 * @test-type unit
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { MetricsCollector } from "../metrics-collector.js";
import type { PipelineEvent } from "../types.js";

describe("MetricsCollector", () => {
  let tempDir: string;
  let collector: MetricsCollector;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "choragen-metrics-test-")
    );
    collector = new MetricsCollector(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("record", () => {
    it("records an event and returns it with id and timestamp", async () => {
      const event = await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "001-test-task",
        chainId: "CHAIN-001-test",
      });

      expect(event.id).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.eventType).toBe("task:started");
      expect(event.entityId).toBe("001-test-task");
    });

    it("creates metrics directory if not exists", async () => {
      await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "001-test-task",
      });

      const metricsDir = path.join(tempDir, ".choragen/metrics");
      const stat = await fs.stat(metricsDir);
      expect(stat.isDirectory()).toBe(true);
    });

    it("appends events to JSONL file", async () => {
      await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "001-test-task",
      });

      await collector.record({
        eventType: "task:completed",
        entityType: "task",
        entityId: "001-test-task",
      });

      const eventsPath = path.join(
        tempDir,
        ".choragen/metrics/events.jsonl"
      );
      const content = await fs.readFile(eventsPath, "utf-8");
      const lines = content.trim().split("\n");

      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0]).eventType).toBe("task:started");
      expect(JSON.parse(lines[1]).eventType).toBe("task:completed");
    });

    it("generates unique IDs for each event", async () => {
      const event1 = await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "001-test-task",
      });

      const event2 = await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "002-test-task",
      });

      expect(event1.id).not.toBe(event2.id);
    });

    it("uses ISO 8601 format for timestamps", async () => {
      const event = await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "001-test-task",
      });

      // ISO 8601 format check
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
      expect(event.timestamp).toMatch(isoRegex);
    });

    it("preserves optional fields", async () => {
      const event = await collector.record({
        eventType: "task:completed",
        entityType: "task",
        entityId: "001-test-task",
        chainId: "CHAIN-001-test",
        requestId: "CR-20241207-001",
        model: "claude-3.5-sonnet",
        tokens: { input: 1000, output: 500 },
        metadata: { duration: 5000 },
      });

      expect(event.chainId).toBe("CHAIN-001-test");
      expect(event.requestId).toBe("CR-20241207-001");
      expect(event.model).toBe("claude-3.5-sonnet");
      expect(event.tokens).toEqual({ input: 1000, output: 500 });
      expect(event.metadata).toEqual({ duration: 5000 });
    });
  });

  describe("getEvents", () => {
    it("returns empty array when no events exist", async () => {
      const events = await collector.getEvents();
      expect(events).toEqual([]);
    });

    it("returns all events when no filter provided", async () => {
      await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "001-test-task",
      });

      await collector.record({
        eventType: "task:completed",
        entityType: "task",
        entityId: "001-test-task",
      });

      const events = await collector.getEvents();
      expect(events).toHaveLength(2);
    });

    it("filters by event type", async () => {
      await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "001-test-task",
      });

      await collector.record({
        eventType: "task:completed",
        entityType: "task",
        entityId: "001-test-task",
      });

      const events = await collector.getEvents({ eventType: "task:started" });
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe("task:started");
    });

    it("filters by multiple event types", async () => {
      await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "001-test-task",
      });

      await collector.record({
        eventType: "task:completed",
        entityType: "task",
        entityId: "001-test-task",
      });

      await collector.record({
        eventType: "task:rework",
        entityType: "task",
        entityId: "001-test-task",
      });

      const events = await collector.getEvents({
        eventType: ["task:started", "task:completed"],
      });
      expect(events).toHaveLength(2);
    });

    it("filters by chain ID", async () => {
      await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "001-test-task",
        chainId: "CHAIN-001-test",
      });

      await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "002-test-task",
        chainId: "CHAIN-002-other",
      });

      const events = await collector.getEvents({ chainId: "CHAIN-001-test" });
      expect(events).toHaveLength(1);
      expect(events[0].entityId).toBe("001-test-task");
    });

    it("filters by request ID", async () => {
      await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "001-test-task",
        requestId: "CR-20241207-001",
      });

      await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "002-test-task",
        requestId: "CR-20241207-002",
      });

      const events = await collector.getEvents({
        requestId: "CR-20241207-001",
      });
      expect(events).toHaveLength(1);
      expect(events[0].entityId).toBe("001-test-task");
    });

    it("filters by date range", async () => {
      // Write events with known timestamps directly to file
      const eventsPath = path.join(
        tempDir,
        ".choragen/metrics/events.jsonl"
      );
      await fs.mkdir(path.dirname(eventsPath), { recursive: true });

      const baseTime = Date.now();
      const events: PipelineEvent[] = [
        {
          id: "event-1",
          timestamp: new Date(baseTime - 1000).toISOString(),
          eventType: "task:started",
          entityType: "task",
          entityId: "001-test-task",
        },
        {
          id: "event-2",
          timestamp: new Date(baseTime + 1000).toISOString(),
          eventType: "task:completed",
          entityType: "task",
          entityId: "001-test-task",
        },
      ];

      const content = events.map((e) => JSON.stringify(e)).join("\n") + "\n";
      await fs.writeFile(eventsPath, content, "utf-8");

      const midpoint = new Date(baseTime);
      const eventsSince = await collector.getEvents({ since: midpoint });
      expect(eventsSince).toHaveLength(1);
      expect(eventsSince[0].eventType).toBe("task:completed");
    });

    it("matches chain events by entityId when filtering by chainId", async () => {
      await collector.record({
        eventType: "chain:created",
        entityType: "chain",
        entityId: "CHAIN-001-test",
      });

      const events = await collector.getEvents({ chainId: "CHAIN-001-test" });
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe("chain:created");
    });
  });

  describe("getTaskMetrics", () => {
    it("returns zero metrics when no events exist", async () => {
      const metrics = await collector.getTaskMetrics();

      expect(metrics.totalTasks).toBe(0);
      expect(metrics.completedTasks).toBe(0);
      expect(metrics.avgCycleTimeMs).toBe(0);
      expect(metrics.p50CycleTimeMs).toBe(0);
      expect(metrics.p90CycleTimeMs).toBe(0);
    });

    it("counts total and completed tasks", async () => {
      await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "001-test-task",
      });

      await collector.record({
        eventType: "task:completed",
        entityType: "task",
        entityId: "001-test-task",
      });

      await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "002-test-task",
      });

      const metrics = await collector.getTaskMetrics();
      expect(metrics.totalTasks).toBe(2);
      expect(metrics.completedTasks).toBe(1);
    });

    it("calculates cycle time for completed tasks", async () => {
      // Start task
      await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "001-test-task",
      });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Complete task
      await collector.record({
        eventType: "task:completed",
        entityType: "task",
        entityId: "001-test-task",
      });

      const metrics = await collector.getTaskMetrics();
      const MIN_EXPECTED_CYCLE_TIME = 40;
      expect(metrics.avgCycleTimeMs).toBeGreaterThanOrEqual(
        MIN_EXPECTED_CYCLE_TIME
      );
    });

    it("calculates percentiles correctly", async () => {
      // Create events with known cycle times by manually writing to file
      const eventsPath = path.join(
        tempDir,
        ".choragen/metrics/events.jsonl"
      );
      await fs.mkdir(path.dirname(eventsPath), { recursive: true });

      const baseTime = Date.now();
      const events: PipelineEvent[] = [];

      // Create 10 tasks with cycle times: 100, 200, 300, ..., 1000ms
      const TASK_COUNT = 10;
      for (let i = 1; i <= TASK_COUNT; i++) {
        const startTime = new Date(baseTime + i * 2000).toISOString();
        const endTime = new Date(
          baseTime + i * 2000 + i * 100
        ).toISOString();

        events.push({
          id: `start-${i}`,
          timestamp: startTime,
          eventType: "task:started",
          entityType: "task",
          entityId: `task-${i}`,
        });

        events.push({
          id: `end-${i}`,
          timestamp: endTime,
          eventType: "task:completed",
          entityType: "task",
          entityId: `task-${i}`,
        });
      }

      const content = events.map((e) => JSON.stringify(e)).join("\n") + "\n";
      await fs.writeFile(eventsPath, content, "utf-8");

      const metrics = await collector.getTaskMetrics();

      // Cycle times: 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000
      // Average: 550
      const EXPECTED_AVG = 550;
      expect(metrics.avgCycleTimeMs).toBe(EXPECTED_AVG);

      // P50 (5th value): 500
      const EXPECTED_P50 = 500;
      expect(metrics.p50CycleTimeMs).toBe(EXPECTED_P50);

      // P90 (9th value): 900
      const EXPECTED_P90 = 900;
      expect(metrics.p90CycleTimeMs).toBe(EXPECTED_P90);
    });

    it("filters by chain ID", async () => {
      await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "001-test-task",
        chainId: "CHAIN-001-test",
      });

      await collector.record({
        eventType: "task:completed",
        entityType: "task",
        entityId: "001-test-task",
        chainId: "CHAIN-001-test",
      });

      await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "002-test-task",
        chainId: "CHAIN-002-other",
      });

      const metrics = await collector.getTaskMetrics({
        chainId: "CHAIN-001-test",
      });
      expect(metrics.totalTasks).toBe(1);
      expect(metrics.completedTasks).toBe(1);
    });
  });

  describe("getChainMetrics", () => {
    it("returns zero metrics when no events exist", async () => {
      const metrics = await collector.getChainMetrics();

      expect(metrics.totalChains).toBe(0);
      expect(metrics.completedChains).toBe(0);
      expect(metrics.avgTasksPerChain).toBe(0);
    });

    it("counts total and completed chains", async () => {
      await collector.record({
        eventType: "chain:created",
        entityType: "chain",
        entityId: "CHAIN-001-test",
      });

      await collector.record({
        eventType: "chain:completed",
        entityType: "chain",
        entityId: "CHAIN-001-test",
      });

      await collector.record({
        eventType: "chain:created",
        entityType: "chain",
        entityId: "CHAIN-002-other",
      });

      const metrics = await collector.getChainMetrics();
      expect(metrics.totalChains).toBe(2);
      expect(metrics.completedChains).toBe(1);
    });

    it("calculates average tasks per chain", async () => {
      // Chain 1 with 2 tasks
      await collector.record({
        eventType: "chain:created",
        entityType: "chain",
        entityId: "CHAIN-001-test",
      });

      await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "001-task-a",
        chainId: "CHAIN-001-test",
      });

      await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "001-task-b",
        chainId: "CHAIN-001-test",
      });

      // Chain 2 with 1 task
      await collector.record({
        eventType: "chain:created",
        entityType: "chain",
        entityId: "CHAIN-002-other",
      });

      await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "002-task-a",
        chainId: "CHAIN-002-other",
      });

      const metrics = await collector.getChainMetrics();
      const EXPECTED_AVG_TASKS = 1.5;
      expect(metrics.avgTasksPerChain).toBe(EXPECTED_AVG_TASKS);
    });
  });

  describe("getReworkMetrics", () => {
    it("returns zero metrics when no events exist", async () => {
      const metrics = await collector.getReworkMetrics();

      expect(metrics.totalReworks).toBe(0);
      expect(metrics.reworkRate).toBe(0);
      expect(metrics.firstTimeRightRate).toBe(0);
      expect(metrics.avgReworkIterations).toBe(0);
    });

    it("counts total rework events", async () => {
      await collector.record({
        eventType: "task:rework",
        entityType: "task",
        entityId: "001-test-task",
      });

      await collector.record({
        eventType: "task:rework",
        entityType: "task",
        entityId: "001-test-task",
      });

      await collector.record({
        eventType: "task:completed",
        entityType: "task",
        entityId: "001-test-task",
      });

      const metrics = await collector.getReworkMetrics();
      expect(metrics.totalReworks).toBe(2);
    });

    it("calculates rework rate correctly", async () => {
      // Task 1: completed with rework
      await collector.record({
        eventType: "task:rework",
        entityType: "task",
        entityId: "001-test-task",
      });

      await collector.record({
        eventType: "task:completed",
        entityType: "task",
        entityId: "001-test-task",
      });

      // Task 2: completed without rework
      await collector.record({
        eventType: "task:completed",
        entityType: "task",
        entityId: "002-test-task",
      });

      const metrics = await collector.getReworkMetrics();
      const EXPECTED_REWORK_RATE = 0.5;
      expect(metrics.reworkRate).toBe(EXPECTED_REWORK_RATE);
    });

    it("calculates first-time-right rate correctly", async () => {
      // Task 1: completed with rework
      await collector.record({
        eventType: "task:rework",
        entityType: "task",
        entityId: "001-test-task",
      });

      await collector.record({
        eventType: "task:completed",
        entityType: "task",
        entityId: "001-test-task",
      });

      // Task 2: completed without rework
      await collector.record({
        eventType: "task:completed",
        entityType: "task",
        entityId: "002-test-task",
      });

      // Task 3: completed without rework
      await collector.record({
        eventType: "task:completed",
        entityType: "task",
        entityId: "003-test-task",
      });

      const metrics = await collector.getReworkMetrics();
      // 2 out of 3 tasks completed without rework
      const EXPECTED_FTR_RATE = 2 / 3;
      expect(metrics.firstTimeRightRate).toBeCloseTo(EXPECTED_FTR_RATE);
    });

    it("calculates average rework iterations", async () => {
      // Task 1: 2 reworks
      await collector.record({
        eventType: "task:rework",
        entityType: "task",
        entityId: "001-test-task",
      });

      await collector.record({
        eventType: "task:rework",
        entityType: "task",
        entityId: "001-test-task",
      });

      await collector.record({
        eventType: "task:completed",
        entityType: "task",
        entityId: "001-test-task",
      });

      // Task 2: 1 rework
      await collector.record({
        eventType: "task:rework",
        entityType: "task",
        entityId: "002-test-task",
      });

      await collector.record({
        eventType: "task:completed",
        entityType: "task",
        entityId: "002-test-task",
      });

      const metrics = await collector.getReworkMetrics();
      // 3 total reworks across 2 tasks with rework = 1.5 avg
      const EXPECTED_AVG_REWORK = 1.5;
      expect(metrics.avgReworkIterations).toBe(EXPECTED_AVG_REWORK);
    });

    it("filters by chain ID", async () => {
      await collector.record({
        eventType: "task:rework",
        entityType: "task",
        entityId: "001-test-task",
        chainId: "CHAIN-001-test",
      });

      await collector.record({
        eventType: "task:completed",
        entityType: "task",
        entityId: "001-test-task",
        chainId: "CHAIN-001-test",
      });

      await collector.record({
        eventType: "task:rework",
        entityType: "task",
        entityId: "002-test-task",
        chainId: "CHAIN-002-other",
      });

      await collector.record({
        eventType: "task:completed",
        entityType: "task",
        entityId: "002-test-task",
        chainId: "CHAIN-002-other",
      });

      const metrics = await collector.getReworkMetrics({
        chainId: "CHAIN-001-test",
      });
      expect(metrics.totalReworks).toBe(1);
    });
  });

  describe("error handling", () => {
    it("handles missing metrics directory gracefully on read", async () => {
      const events = await collector.getEvents();
      expect(events).toEqual([]);
    });

    it("handles empty events file gracefully", async () => {
      const eventsPath = path.join(
        tempDir,
        ".choragen/metrics/events.jsonl"
      );
      await fs.mkdir(path.dirname(eventsPath), { recursive: true });
      await fs.writeFile(eventsPath, "", "utf-8");

      const events = await collector.getEvents();
      expect(events).toEqual([]);
    });
  });

  describe("persistence", () => {
    it("survives collector recreation", async () => {
      await collector.record({
        eventType: "task:started",
        entityType: "task",
        entityId: "001-test-task",
      });

      // Create new collector instance
      const newCollector = new MetricsCollector(tempDir);
      const events = await newCollector.getEvents();

      expect(events).toHaveLength(1);
      expect(events[0].entityId).toBe("001-test-task");
    });
  });
});
