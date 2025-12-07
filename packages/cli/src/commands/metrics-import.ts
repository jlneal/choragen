// ADR: ADR-004-pipeline-metrics

/**
 * Metrics import command - reconstruct historical events from git history
 */

import { MetricsCollector, type EventType } from "@choragen/core";
import { execSync } from "node:child_process";

/**
 * Options for the metrics import command
 */
export interface MetricsImportOptions {
  /** Start date for import (ISO string or git date format) */
  since?: string;
  /** Show what would be imported without writing */
  dryRun: boolean;
}

/**
 * A reconstructed event from git history
 */
export interface ReconstructedEvent {
  /** Event type */
  eventType: EventType;
  /** Entity type */
  entityType: "task" | "chain" | "request";
  /** Entity ID */
  entityId: string;
  /** Chain ID (for task events) */
  chainId?: string;
  /** Request ID (for chain events) */
  requestId?: string;
  /** Commit timestamp (ISO format) */
  timestamp: string;
  /** Commit hash */
  commitHash: string;
  /** File path that triggered this event */
  filePath: string;
}

/**
 * Summary of events found during import
 */
export interface ImportSummary {
  /** Events by type */
  eventCounts: Record<EventType, number>;
  /** Total events found */
  totalEvents: number;
  /** Events that would be imported (excluding duplicates) */
  newEvents: number;
  /** Events that already exist */
  duplicateEvents: number;
  /** All reconstructed events */
  events: ReconstructedEvent[];
}

/**
 * Git log entry for file changes
 */
interface GitLogEntry {
  commitHash: string;
  timestamp: string;
  filePath: string;
  status: "A" | "M" | "D" | "R"; // Added, Modified, Deleted, Renamed
  oldPath?: string; // For renames
}

/**
 * Parse git log output for file changes
 */
function parseGitLog(output: string): GitLogEntry[] {
  const entries: GitLogEntry[] = [];
  const lines = output.trim().split("\n").filter(Boolean);

  let currentCommit: { hash: string; timestamp: string } | null = null;

  for (const line of lines) {
    if (line.startsWith("commit:")) {
      const [, hash, timestamp] = line.split("\t");
      currentCommit = { hash, timestamp };
    } else if (currentCommit && line.match(/^[AMDRC]/)) {
      // Git name-status format: STATUS\tpath or R100\told\tnew
      const parts = line.split("\t");
      const status = parts[0];

      // Handle renames (R100\told\tnew)
      if (status.startsWith("R")) {
        const oldPath = parts[1];
        const newPath = parts[2];
        if (oldPath && newPath) {
          entries.push({
            commitHash: currentCommit.hash,
            timestamp: currentCommit.timestamp,
            filePath: newPath,
            status: "R",
            oldPath,
          });
        }
      } else if (parts[1]) {
        entries.push({
          commitHash: currentCommit.hash,
          timestamp: currentCommit.timestamp,
          filePath: parts[1],
          status: status as "A" | "M" | "D",
        });
      }
    }
  }

  return entries;
}

/**
 * Extract chain ID from a task file path
 * e.g., docs/tasks/todo/CHAIN-001-foo/001-bar.md -> CHAIN-001-foo
 */
function extractChainId(filePath: string): string | undefined {
  const match = filePath.match(/docs\/tasks\/[^/]+\/(CHAIN-\d+-[^/]+)\//);
  return match?.[1];
}

/**
 * Extract task ID from a task file path
 * e.g., docs/tasks/todo/CHAIN-001-foo/001-bar.md -> 001-bar
 */
function extractTaskId(filePath: string): string | undefined {
  const match = filePath.match(/docs\/tasks\/[^/]+\/CHAIN-\d+-[^/]+\/(\d+-[^/]+)\.md$/);
  return match?.[1];
}

/**
 * Check if a path is in the done/ directory
 */
function isInDoneDir(filePath: string): boolean {
  return filePath.includes("/done/");
}

/**
 * Check if a path is a rework task (contains -rework in the filename)
 */
function isReworkTask(filePath: string): boolean {
  return /-rework(-\d+)?\.md$/.test(filePath);
}

/**
 * Extract request ID from a request file path
 * e.g., docs/requests/change-requests/done/CR-20241201-001-foo.md -> CR-20241201-001
 */
function extractRequestId(filePath: string): string | undefined {
  const match = filePath.match(/(CR|FR)-\d{8}-\d+/);
  return match?.[0];
}

/**
 * Reconstruct events from git history
 */
export async function reconstructEvents(
  projectRoot: string,
  options: MetricsImportOptions
): Promise<ReconstructedEvent[]> {
  const events: ReconstructedEvent[] = [];

  // Build git log command
  // -M: detect renames
  // --diff-filter=ADMR: only show Added, Deleted, Modified, Renamed
  const sinceArg = options.since ? `--since="${options.since}"` : "";
  const gitLogCmd = `git log -M --name-status --diff-filter=ADMR --format="commit:%H%x09%aI" ${sinceArg} -- docs/tasks docs/requests`;

  let output: string;
  try {
    output = execSync(gitLogCmd, {
      cwd: projectRoot,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large repos
    });
  } catch {
    // No commits found or git error
    return events;
  }

  const gitEntries = parseGitLog(output);

  for (const entry of gitEntries) {
    const event = classifyGitEntry(entry);
    if (event) {
      events.push(event);
    }
  }

  // Sort by timestamp (oldest first)
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return events;
}

/**
 * Classify a git log entry into an event type
 */
function classifyGitEntry(entry: GitLogEntry): ReconstructedEvent | null {
  const { filePath, status, oldPath, commitHash, timestamp } = entry;

  // Task files
  if (filePath.match(/docs\/tasks\/[^/]+\/CHAIN-\d+-[^/]+\/\d+-[^/]+\.md$/)) {
    const chainId = extractChainId(filePath);
    const taskId = extractTaskId(filePath);

    if (!chainId || !taskId) return null;

    // Task file created -> task:started
    if (status === "A") {
      // Check if it's a rework task
      if (isReworkTask(filePath)) {
        return {
          eventType: "task:rework",
          entityType: "task",
          entityId: taskId,
          chainId,
          timestamp,
          commitHash,
          filePath,
        };
      }
      return {
        eventType: "task:started",
        entityType: "task",
        entityId: taskId,
        chainId,
        timestamp,
        commitHash,
        filePath,
      };
    }

    // Task moved to done/ -> task:completed
    if (status === "R" && oldPath && !isInDoneDir(oldPath) && isInDoneDir(filePath)) {
      return {
        eventType: "task:completed",
        entityType: "task",
        entityId: taskId,
        chainId,
        timestamp,
        commitHash,
        filePath,
      };
    }

    return null;
  }

  // Chain directories (detected via chain.yaml or first task)
  if (filePath.match(/docs\/tasks\/\.chains\/CHAIN-\d+-[^/]+\.yaml$/)) {
    const chainMatch = filePath.match(/(CHAIN-\d+-[^/]+)\.yaml$/);
    if (!chainMatch) return null;

    const chainId = chainMatch[1];

    if (status === "A") {
      return {
        eventType: "chain:created",
        entityType: "chain",
        entityId: chainId,
        timestamp,
        commitHash,
        filePath,
      };
    }

    return null;
  }

  // Request files
  if (filePath.match(/docs\/requests\/(change-requests|fix-requests)\/[^/]+\/(CR|FR)-\d{8}-\d+.*\.md$/)) {
    const requestId = extractRequestId(filePath);
    if (!requestId) return null;

    // Request moved to done/ -> request:closed
    if (status === "R" && oldPath && !isInDoneDir(oldPath) && isInDoneDir(filePath)) {
      return {
        eventType: "request:closed",
        entityType: "request",
        entityId: requestId,
        timestamp,
        commitHash,
        filePath,
      };
    }

    return null;
  }

  return null;
}

/**
 * Check for duplicate events in existing metrics
 * Uses eventType:entityId:commitHash as the key for imported events
 */
async function findDuplicates(
  collector: MetricsCollector,
  events: ReconstructedEvent[]
): Promise<Set<string>> {
  const existingEvents = await collector.getEvents();
  const duplicates = new Set<string>();

  // Create keys for existing events that were imported from git
  const existingKeys = new Set<string>();
  for (const event of existingEvents) {
    // Check if this event was imported from git (has commitHash in metadata)
    const commitHash = event.metadata?.commitHash as string | undefined;
    if (commitHash) {
      const key = `${event.eventType}:${event.entityId}:${commitHash}`;
      existingKeys.add(key);
    }
  }

  // Check each reconstructed event
  for (const event of events) {
    const key = `${event.eventType}:${event.entityId}:${event.commitHash}`;
    if (existingKeys.has(key)) {
      duplicates.add(key);
    }
  }

  return duplicates;
}

/**
 * Import metrics from git history
 */
export async function importMetrics(
  projectRoot: string,
  options: MetricsImportOptions
): Promise<ImportSummary> {
  const collector = new MetricsCollector(projectRoot);

  // Reconstruct events from git history
  const events = await reconstructEvents(projectRoot, options);

  // Find duplicates
  const duplicateKeys = await findDuplicates(collector, events);

  // Count events by type
  const eventCounts: Record<EventType, number> = {
    "task:started": 0,
    "task:completed": 0,
    "task:rework": 0,
    "chain:created": 0,
    "chain:completed": 0,
    "request:created": 0,
    "request:closed": 0,
  };

  let newEvents = 0;
  let duplicateEvents = 0;

  for (const event of events) {
    eventCounts[event.eventType]++;

    const key = `${event.eventType}:${event.entityId}:${event.commitHash}`;
    if (duplicateKeys.has(key)) {
      duplicateEvents++;
    } else {
      newEvents++;
    }
  }

  // If not dry run, import the events
  if (!options.dryRun) {
    for (const event of events) {
      const key = `${event.eventType}:${event.entityId}:${event.commitHash}`;
      if (duplicateKeys.has(key)) {
        continue; // Skip duplicates
      }

      await collector.record({
        eventType: event.eventType,
        entityType: event.entityType,
        entityId: event.entityId,
        chainId: event.chainId,
        requestId: event.requestId,
        metadata: {
          importedFromGit: true,
          commitHash: event.commitHash,
          filePath: event.filePath,
        },
      });
    }
  }

  return {
    eventCounts,
    totalEvents: events.length,
    newEvents,
    duplicateEvents,
    events,
  };
}

/**
 * Format import summary for CLI output
 */
export function formatImportSummary(summary: ImportSummary, dryRun: boolean): string {
  const lines: string[] = [];

  if (dryRun) {
    lines.push("Importing metrics from git history (dry run)...\n");
  } else {
    lines.push("Importing metrics from git history...\n");
  }

  lines.push("Found:");

  // Only show non-zero counts
  const eventTypes: EventType[] = [
    "chain:created",
    "task:started",
    "task:completed",
    "task:rework",
    "request:closed",
  ];

  for (const eventType of eventTypes) {
    const count = summary.eventCounts[eventType];
    if (count > 0) {
      lines.push(`  - ${count} ${eventType} events`);
    }
  }

  lines.push("");
  lines.push(`Total: ${summary.totalEvents} events`);

  if (summary.duplicateEvents > 0) {
    lines.push(`Duplicates (skipped): ${summary.duplicateEvents}`);
  }

  lines.push(`New events: ${summary.newEvents}`);

  if (dryRun && summary.newEvents > 0) {
    lines.push("\nRun without --dry-run to import these events.");
  } else if (!dryRun && summary.newEvents > 0) {
    lines.push(`\n✓ Imported ${summary.newEvents} events`);
  } else if (summary.newEvents === 0) {
    lines.push("\nNo new events to import.");
  }

  return lines.join("\n");
}
