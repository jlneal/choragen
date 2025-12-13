/**
 * @design-doc docs/design/core/features/standard-workflow.md
 * @test-type unit
 * @user-intent "Submit a task for review"
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { ChainManager } from "@choragen/core";
import { submitTaskCommand } from "../submit.js";

describe("task:submit command", () => {
  let tempDir: string;
  let chainManager: ChainManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-task-submit-"));
    chainManager = new ChainManager(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function createInProgressTask() {
    const taskManager = chainManager.getTaskManager();
    const chain = await chainManager.createChain({
      requestId: "CR-001",
      slug: "submit-flow",
      title: "Submit Flow",
    });
    const task = await taskManager.createTask({
      chainId: chain.id,
      slug: "demo-task",
      title: "Demo Task",
      description: "Test task for submission",
    });

    await taskManager.transitionTask(chain.id, task.id, "todo");
    await taskManager.startTask(chain.id, task.id);

    return { chain, task, taskManager };
  }

  it("moves task to in-review and emits task:submitted", async () => {
    const { chain, task, taskManager } = await createInProgressTask();
    const emitEvent = vi.fn().mockResolvedValue(undefined);

    const result = await submitTaskCommand(
      { chainManager, taskManager, emitEvent },
      { chainId: chain.id, taskId: task.id }
    );

    expect(result.success).toBe(true);
    expect(result.previousStatus).toBe("in-progress");
    expect(result.newStatus).toBe("in-review");
    expect(result.requestId).toBe(chain.requestId);
    expect(result.event?.eventType).toBe("task:submitted");

    const updated = await taskManager.getTask(chain.id, task.id);
    expect(updated?.status).toBe("in-review");

    const inReviewPath = path.join(
      tempDir,
      "docs/tasks/in-review",
      chain.id,
      `${task.id}.md`
    );
    await expect(fs.stat(inReviewPath)).resolves.toBeDefined();

    const inProgressPath = path.join(
      tempDir,
      "docs/tasks/in-progress",
      chain.id,
      `${task.id}.md`
    );
    await expect(fs.stat(inProgressPath)).rejects.toThrow();

    expect(emitEvent).toHaveBeenCalledWith({
      eventType: "task:submitted",
      entityType: "task",
      entityId: task.id,
      chainId: chain.id,
      requestId: chain.requestId,
      metadata: {
        previousStatus: "in-progress",
        newStatus: "in-review",
      },
    });
  });

  it("fails gracefully when task is not in-progress", async () => {
    const taskManager = chainManager.getTaskManager();
    const chain = await chainManager.createChain({
      requestId: "CR-002",
      slug: "submit-invalid",
      title: "Submit Invalid",
    });
    const task = await taskManager.createTask({
      chainId: chain.id,
      slug: "not-started",
      title: "Not Started",
      description: "Task stays in todo",
    });
    await taskManager.transitionTask(chain.id, task.id, "todo");

    const emitEvent = vi.fn();

    const result = await submitTaskCommand(
      { chainManager, taskManager, emitEvent },
      { chainId: chain.id, taskId: task.id }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("in-progress");
    expect(result.previousStatus).toBe("todo");

    const persisted = await taskManager.getTask(chain.id, task.id);
    expect(persisted?.status).toBe("todo");
    expect(emitEvent).not.toHaveBeenCalled();
  });
});
