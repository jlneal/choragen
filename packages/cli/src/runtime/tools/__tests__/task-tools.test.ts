/**
 * @design-doc docs/adr/done/ADR-013-agent-tools-design.md
 * @test-type unit
 * @user-intent "Verify task lifecycle tools submit and request changes correctly"
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { TaskManager } from "@choragen/core";
import type { Task } from "@choragen/core";
import { executeTaskSubmit, executeTaskRequestChanges } from "../task-tools.js";
import type { ExecutionContext } from "../executor.js";

const CHAIN_ID = "CHAIN-001-test";

describe("task lifecycle tools", () => {
  let tempDir: string;
  let taskManager: TaskManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-task-tools-"));
    taskManager = new TaskManager(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function createTaskInProgress(): Promise<Task> {
    const task = await taskManager.createTask({
      chainId: CHAIN_ID,
      slug: "demo-task",
      title: "Demo Task",
      description: "Test task for lifecycle tools",
    });

    await taskManager.transitionTask(CHAIN_ID, task.id, "todo");
    await taskManager.startTask(CHAIN_ID, task.id);
    const updated = await taskManager.getTask(CHAIN_ID, task.id);
    if (!updated) throw new Error("Failed to prepare task");
    return updated;
  }

  async function createTaskInReview(): Promise<Task> {
    const task = await createTaskInProgress();
    await taskManager.completeTask(CHAIN_ID, task.id);
    const updated = await taskManager.getTask(CHAIN_ID, task.id);
    if (!updated) throw new Error("Failed to move task to in-review");
    return updated;
  }

  it("submits a task and emits task.submitted", async () => {
    const task = await createTaskInProgress();
    const emitEvent = vi.fn();
    const context: ExecutionContext = {
      role: "impl",
      workspaceRoot: tempDir,
      eventEmitter: emitEvent,
    };

    const result = await executeTaskSubmit(
      { chainId: CHAIN_ID, taskId: task.id, summary: "Implemented feature" },
      context
    );

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      chainId: CHAIN_ID,
      taskId: task.id,
      previousStatus: "in-progress",
      newStatus: "in-review",
      summary: "Implemented feature",
    });

    const submittedTask = await taskManager.getTask(CHAIN_ID, task.id);
    expect(submittedTask?.status).toBe("in-review");

    expect(emitEvent).toHaveBeenCalledWith({
      type: "task.submitted",
      payload: expect.objectContaining({
        chainId: CHAIN_ID,
        taskId: task.id,
        previousStatus: "in-progress",
        newStatus: "in-review",
        summary: "Implemented feature",
      }),
    });
  });

  it("requests changes on a task and emits task.changes_requested", async () => {
    const task = await createTaskInReview();
    const emitEvent = vi.fn();
    const context: ExecutionContext = {
      role: "control",
      workspaceRoot: tempDir,
      eventEmitter: emitEvent,
    };

    const result = await executeTaskRequestChanges(
      {
        chainId: CHAIN_ID,
        taskId: task.id,
        reason: "Add missing tests",
        suggestions: ["Cover edge cases", "Include regression suite"],
      },
      context
    );

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      chainId: CHAIN_ID,
      taskId: task.id,
      previousStatus: "in-review",
      newStatus: "in-progress",
      reason: "Add missing tests",
      suggestions: ["Cover edge cases", "Include regression suite"],
    });

    const reopenedTask = await taskManager.getTask(CHAIN_ID, task.id);
    expect(reopenedTask?.status).toBe("in-progress");

    expect(emitEvent).toHaveBeenCalledWith({
      type: "task.changes_requested",
      payload: expect.objectContaining({
        chainId: CHAIN_ID,
        taskId: task.id,
        previousStatus: "in-review",
        newStatus: "in-progress",
        reason: "Add missing tests",
        suggestions: ["Cover edge cases", "Include regression suite"],
      }),
    });
  });
});
