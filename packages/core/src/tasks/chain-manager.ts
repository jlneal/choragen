/**
 * Chain lifecycle management
 *
 * Chains are sequences of tasks derived from a CR/FR.
 * Chain state is derived from the aggregate state of its tasks.
 *
 * ADR: ADR-001-task-file-format
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import type {
  Chain,
  Task,
  TaskStatus,
  TaskConfig,
  CreateChainOptions,
} from "./types.js";
import { DEFAULT_TASK_CONFIG, TASK_STATUSES } from "./types.js";
import { TaskManager } from "./task-manager.js";
import { formatChainId, parseChainId } from "./task-parser.js";

export class ChainManager {
  private config: TaskConfig;
  private projectRoot: string;
  private taskManager: TaskManager;

  constructor(projectRoot: string, config: Partial<TaskConfig> = {}) {
    this.projectRoot = projectRoot;
    this.config = { ...DEFAULT_TASK_CONFIG, ...config };
    this.taskManager = new TaskManager(projectRoot, config);
  }

  /**
   * Get the task manager for direct task operations
   */
  getTaskManager(): TaskManager {
    return this.taskManager;
  }

  /**
   * Get the full path to the tasks directory
   */
  private getTasksPath(): string {
    return path.join(this.projectRoot, this.config.tasksPath);
  }

  /**
   * Create a new chain
   */
  async createChain(options: CreateChainOptions): Promise<Chain> {
    const { requestId, slug, title, description, type, dependsOn } = options;

    // Find the next sequence number
    const existingChains = await this.getAllChains();
    const maxSeq = existingChains.reduce(
      (max, c) => Math.max(max, c.sequence),
      0
    );
    const sequence = maxSeq + 1;

    const chainId = formatChainId(sequence, slug);
    const now = new Date();

    const chain: Chain = {
      id: chainId,
      sequence,
      slug,
      requestId,
      title,
      description: description || "",
      type,
      dependsOn,
      tasks: [],
      createdAt: now,
      updatedAt: now,
    };

    // Create the chain directory in backlog
    const chainDir = path.join(this.getTasksPath(), "backlog", chainId);
    await fs.mkdir(chainDir, { recursive: true });

    // Write chain metadata file
    await this.writeChainMetadata(chain);

    return chain;
  }

  /**
   * Get a chain by ID
   */
  async getChain(chainId: string): Promise<Chain | null> {
    // Find chain directory in any status
    for (const status of TASK_STATUSES) {
      const chainDir = path.join(this.getTasksPath(), status, chainId);
      try {
        await fs.access(chainDir);
        // Found the chain, load its data
        return this.loadChain(chainId);
      } catch {
        // Not in this status, continue
      }
    }

    // Also check for chain metadata file
    const metadataPath = path.join(
      this.getTasksPath(),
      ".chains",
      `${chainId}.json`
    );
    try {
      await fs.access(metadataPath);
      return this.loadChain(chainId);
    } catch {
      return null;
    }
  }

  /**
   * Load a chain with all its tasks
   */
  private async loadChain(chainId: string): Promise<Chain | null> {
    const parsed = parseChainId(chainId);
    if (!parsed) return null;

    // Try to load metadata
    const metadataPath = path.join(
      this.getTasksPath(),
      ".chains",
      `${chainId}.json`
    );

    let metadata: Partial<Chain> = {};
    try {
      const content = await fs.readFile(metadataPath, "utf-8");
      metadata = JSON.parse(content);
    } catch {
      // No metadata file, use defaults
    }

    // Load all tasks for this chain
    const tasks = await this.taskManager.getTasksForChain(chainId);

    return {
      id: chainId,
      sequence: parsed.sequence,
      slug: parsed.slug,
      requestId: metadata.requestId || "",
      title: metadata.title || chainId,
      description: metadata.description || "",
      type: metadata.type,
      dependsOn: metadata.dependsOn,
      tasks,
      createdAt: metadata.createdAt ? new Date(metadata.createdAt) : new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Write chain metadata to file
   */
  private async writeChainMetadata(chain: Chain): Promise<void> {
    const chainsDir = path.join(this.getTasksPath(), ".chains");
    await fs.mkdir(chainsDir, { recursive: true });

    const metadataPath = path.join(chainsDir, `${chain.id}.json`);
    const metadata: Record<string, unknown> = {
      id: chain.id,
      sequence: chain.sequence,
      slug: chain.slug,
      requestId: chain.requestId,
      title: chain.title,
      description: chain.description,
      createdAt: chain.createdAt.toISOString(),
      updatedAt: chain.updatedAt.toISOString(),
    };

    // Only include optional fields if they have values
    if (chain.type) {
      metadata.type = chain.type;
    }
    if (chain.dependsOn) {
      metadata.dependsOn = chain.dependsOn;
    }

    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");
  }

  /**
   * Get all chains
   */
  async getAllChains(): Promise<Chain[]> {
    const chains: Chain[] = [];
    const seenChainIds = new Set<string>();

    // Scan all status directories for chain directories
    for (const status of TASK_STATUSES) {
      const statusDir = path.join(this.getTasksPath(), status);
      try {
        const entries = await fs.readdir(statusDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && entry.name.startsWith("CHAIN-")) {
            if (!seenChainIds.has(entry.name)) {
              seenChainIds.add(entry.name);
              const chain = await this.loadChain(entry.name);
              if (chain) chains.push(chain);
            }
          }
        }
      } catch {
        // Directory doesn't exist, continue
      }
    }

    // Also check .chains metadata directory
    const chainsDir = path.join(this.getTasksPath(), ".chains");
    try {
      const files = await fs.readdir(chainsDir);
      for (const file of files) {
        if (file.endsWith(".json")) {
          const chainId = file.replace(".json", "");
          if (!seenChainIds.has(chainId)) {
            seenChainIds.add(chainId);
            const chain = await this.loadChain(chainId);
            if (chain) chains.push(chain);
          }
        }
      }
    } catch {
      // Directory doesn't exist, continue
    }

    return chains.sort((a, b) => a.sequence - b.sequence);
  }

  /**
   * Get the derived status of a chain based on its tasks
   */
  getChainStatus(chain: Chain): TaskStatus {
    if (chain.tasks.length === 0) return "backlog";

    const statuses = chain.tasks.map((t) => t.status);

    // If any task is blocked, chain is blocked
    if (statuses.includes("blocked")) return "blocked";

    // If any task is in-progress, chain is in-progress
    if (statuses.includes("in-progress")) return "in-progress";

    // If any task is in-review, chain is in-review
    if (statuses.includes("in-review")) return "in-review";

    // If all tasks are done, chain is done
    if (statuses.every((s) => s === "done")) return "done";

    // If any task is todo, chain is todo
    if (statuses.includes("todo")) return "todo";

    // Otherwise, chain is in backlog
    return "backlog";
  }

  /**
   * Add a task to a chain
   */
  async addTask(
    chainId: string,
    options: {
      slug: string;
      title: string;
      description: string;
      expectedFiles?: string[];
      acceptance?: string[];
      constraints?: string[];
      notes?: string;
    }
  ): Promise<Task> {
    return this.taskManager.createTask({
      chainId,
      ...options,
    });
  }

  /**
   * Get the next task to work on for a chain
   */
  async getNextTask(chainId: string): Promise<Task | null> {
    return this.taskManager.getNextTask(chainId);
  }

  /**
   * Get chain status summary
   */
  async getChainSummary(chainId: string): Promise<{
    chain: Chain;
    status: TaskStatus;
    taskCounts: Record<TaskStatus, number>;
    progress: number;
  } | null> {
    const chain = await this.getChain(chainId);
    if (!chain) return null;

    const status = this.getChainStatus(chain);

    const taskCounts: Record<TaskStatus, number> = {
      backlog: 0,
      todo: 0,
      "in-progress": 0,
      "in-review": 0,
      done: 0,
      blocked: 0,
    };

    for (const task of chain.tasks) {
      taskCounts[task.status]++;
    }

    const totalTasks = chain.tasks.length;
    const doneTasks = taskCounts.done;
    const progress = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;

    return {
      chain,
      status,
      taskCounts,
      progress,
    };
  }

  /**
   * Update chain metadata
   */
  async updateChain(
    chainId: string,
    updates: Partial<Pick<Chain, "title" | "description" | "requestId" | "type" | "dependsOn">>
  ): Promise<Chain | null> {
    const chain = await this.getChain(chainId);
    if (!chain) return null;

    Object.assign(chain, updates);
    chain.updatedAt = new Date();

    await this.writeChainMetadata(chain);

    return chain;
  }

  /**
   * Delete a chain and all its tasks
   */
  async deleteChain(chainId: string): Promise<boolean> {
    const chain = await this.getChain(chainId);
    if (!chain) return false;

    // Delete all tasks
    for (const task of chain.tasks) {
      await this.taskManager.deleteTask(chainId, task.id);
    }

    // Delete chain directories from all statuses
    for (const status of TASK_STATUSES) {
      const chainDir = path.join(this.getTasksPath(), status, chainId);
      try {
        await fs.rm(chainDir, { recursive: true });
      } catch {
        // Directory doesn't exist, continue
      }
    }

    // Delete metadata file
    const metadataPath = path.join(
      this.getTasksPath(),
      ".chains",
      `${chainId}.json`
    );
    try {
      await fs.unlink(metadataPath);
    } catch {
      // File doesn't exist, continue
    }

    return true;
  }
}
