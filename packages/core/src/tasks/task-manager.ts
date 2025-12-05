/**
 * Task lifecycle management
 *
 * Handles task CRUD operations and status transitions.
 * Tasks are stored as markdown files in status directories.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import type {
  Task,
  TaskStatus,
  TaskConfig,
  CreateTaskOptions,
  TransitionResult,
} from "./types.js";
import { STATUS_TRANSITIONS, DEFAULT_TASK_CONFIG, TASK_STATUSES } from "./types.js";
import {
  parseTaskMarkdown,
  serializeTaskMarkdown,
  formatTaskId,
  parseTaskId,
} from "./task-parser.js";

export class TaskManager {
  private config: TaskConfig;
  private projectRoot: string;

  constructor(projectRoot: string, config: Partial<TaskConfig> = {}) {
    this.projectRoot = projectRoot;
    this.config = { ...DEFAULT_TASK_CONFIG, ...config };
  }

  /**
   * Get the full path to a status directory
   */
  private getStatusPath(status: TaskStatus): string {
    return path.join(this.projectRoot, this.config.tasksPath, status);
  }

  /**
   * Get the full path to a task file
   */
  private getTaskPath(chainId: string, taskId: string, status: TaskStatus): string {
    return path.join(
      this.getStatusPath(status),
      chainId,
      `${taskId}.md`
    );
  }

  /**
   * Create a new task in a chain
   */
  async createTask(options: CreateTaskOptions): Promise<Task> {
    const { chainId, slug, title, description } = options;

    // Find the next sequence number for this chain
    const existingTasks = await this.getTasksForChain(chainId);
    const maxSeq = existingTasks.reduce(
      (max, t) => Math.max(max, t.sequence),
      0
    );
    const sequence = maxSeq + 1;

    const taskId = formatTaskId(sequence, slug);
    const now = new Date();

    const task: Task = {
      id: taskId,
      sequence,
      slug,
      status: "backlog",
      chainId,
      title,
      description,
      expectedFiles: options.expectedFiles || [],
      acceptance: options.acceptance || [],
      constraints: options.constraints || [],
      notes: options.notes || "",
      createdAt: now,
      updatedAt: now,
    };

    // Ensure directory exists
    const taskDir = path.join(this.getStatusPath("backlog"), chainId);
    await fs.mkdir(taskDir, { recursive: true });

    // Write task file
    const taskPath = this.getTaskPath(chainId, taskId, "backlog");
    await fs.writeFile(taskPath, serializeTaskMarkdown(task), "utf-8");

    return task;
  }

  /**
   * Get a task by chain ID and task ID
   */
  async getTask(chainId: string, taskId: string): Promise<Task | null> {
    // Search all status directories
    for (const status of TASK_STATUSES) {
      const taskPath = this.getTaskPath(chainId, taskId, status);
      try {
        const content = await fs.readFile(taskPath, "utf-8");
        return parseTaskMarkdown(content, chainId, status);
      } catch {
        // File doesn't exist in this status, continue searching
      }
    }
    return null;
  }

  /**
   * Get all tasks for a chain
   */
  async getTasksForChain(chainId: string): Promise<Task[]> {
    const tasks: Task[] = [];

    for (const status of TASK_STATUSES) {
      const chainDir = path.join(this.getStatusPath(status), chainId);
      try {
        const files = await fs.readdir(chainDir);
        for (const file of files) {
          if (!file.endsWith(".md")) continue;
          const taskId = file.replace(".md", "");
          const content = await fs.readFile(
            path.join(chainDir, file),
            "utf-8"
          );
          const task = parseTaskMarkdown(content, chainId, status);
          if (task) tasks.push(task);
        }
      } catch {
        // Directory doesn't exist, continue
      }
    }

    return tasks.sort((a, b) => a.sequence - b.sequence);
  }

  /**
   * Transition a task to a new status
   */
  async transitionTask(
    chainId: string,
    taskId: string,
    newStatus: TaskStatus
  ): Promise<TransitionResult> {
    const task = await this.getTask(chainId, taskId);
    if (!task) {
      return {
        success: false,
        task: null as unknown as Task,
        previousStatus: "backlog",
        newStatus,
        error: `Task ${taskId} not found in chain ${chainId}`,
      };
    }

    const previousStatus = task.status;

    // Check if transition is allowed
    const allowedTransitions = STATUS_TRANSITIONS[previousStatus];
    if (!allowedTransitions.includes(newStatus)) {
      return {
        success: false,
        task,
        previousStatus,
        newStatus,
        error: `Cannot transition from ${previousStatus} to ${newStatus}. Allowed: ${allowedTransitions.join(", ")}`,
      };
    }

    // Move the file
    const oldPath = this.getTaskPath(chainId, taskId, previousStatus);
    const newDir = path.join(this.getStatusPath(newStatus), chainId);
    const newPath = this.getTaskPath(chainId, taskId, newStatus);

    await fs.mkdir(newDir, { recursive: true });

    // Update task and write to new location
    task.status = newStatus;
    task.updatedAt = new Date();
    await fs.writeFile(newPath, serializeTaskMarkdown(task), "utf-8");

    // Remove old file
    await fs.unlink(oldPath);

    // Clean up empty directories
    await this.cleanupEmptyDir(path.join(this.getStatusPath(previousStatus), chainId));

    return {
      success: true,
      task,
      previousStatus,
      newStatus,
    };
  }

  /**
   * Start a task (move from todo to in-progress)
   */
  async startTask(chainId: string, taskId: string): Promise<TransitionResult> {
    return this.transitionTask(chainId, taskId, "in-progress");
  }

  /**
   * Complete a task (move from in-progress to in-review)
   */
  async completeTask(chainId: string, taskId: string): Promise<TransitionResult> {
    return this.transitionTask(chainId, taskId, "in-review");
  }

  /**
   * Approve a task (move from in-review to done)
   */
  async approveTask(chainId: string, taskId: string): Promise<TransitionResult> {
    return this.transitionTask(chainId, taskId, "done");
  }

  /**
   * Send a task back for rework (move from in-review to in-progress)
   */
  async reworkTask(chainId: string, taskId: string): Promise<TransitionResult> {
    return this.transitionTask(chainId, taskId, "in-progress");
  }

  /**
   * Block a task
   */
  async blockTask(chainId: string, taskId: string): Promise<TransitionResult> {
    return this.transitionTask(chainId, taskId, "blocked");
  }

  /**
   * Get the next available task for a chain
   */
  async getNextTask(chainId: string): Promise<Task | null> {
    const tasks = await this.getTasksForChain(chainId);

    // First, check if there's a task in-progress
    const inProgress = tasks.find((t) => t.status === "in-progress");
    if (inProgress) return inProgress;

    // Otherwise, get the first todo task
    const todo = tasks.find((t) => t.status === "todo");
    return todo || null;
  }

  /**
   * Update a task's content
   */
  async updateTask(
    chainId: string,
    taskId: string,
    updates: Partial<Pick<Task, "title" | "description" | "expectedFiles" | "acceptance" | "constraints" | "notes">>
  ): Promise<Task | null> {
    const task = await this.getTask(chainId, taskId);
    if (!task) return null;

    // Apply updates
    Object.assign(task, updates);
    task.updatedAt = new Date();

    // Write back
    const taskPath = this.getTaskPath(chainId, taskId, task.status);
    await fs.writeFile(taskPath, serializeTaskMarkdown(task), "utf-8");

    return task;
  }

  /**
   * Delete a task
   */
  async deleteTask(chainId: string, taskId: string): Promise<boolean> {
    const task = await this.getTask(chainId, taskId);
    if (!task) return false;

    const taskPath = this.getTaskPath(chainId, taskId, task.status);
    await fs.unlink(taskPath);
    await this.cleanupEmptyDir(path.join(this.getStatusPath(task.status), chainId));

    return true;
  }

  /**
   * Remove a directory if it's empty
   */
  private async cleanupEmptyDir(dirPath: string): Promise<void> {
    try {
      const files = await fs.readdir(dirPath);
      if (files.length === 0) {
        await fs.rmdir(dirPath);
      }
    } catch {
      // Directory doesn't exist or can't be read, ignore
    }
  }
}
