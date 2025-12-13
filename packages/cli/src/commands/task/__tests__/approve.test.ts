/**
 * @design-doc docs/design/core/features/standard-workflow.md
 * @test-type unit
 * @user-intent "Approve a task after review"
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { ChainManager } from "@choragen/core";
import { approveTaskCommand } from "../approve.js";

describe("task:approve command", () => {
  let tempDir: string;
  let chainManager: ChainManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-task-approve-"));
    chainManager = new ChainManager(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function createTaskInReview() {
    const taskManager = chainManager.getTaskManager();
    const chain = await chainManager.createChain({
      requestId: "CR-003",
      slug: "approve-flow",
      title: "Approve Flow",
    });
    const task = await taskManager.createTask({
      chainId: chain.id,
      slug: "demo-task",
      title: "Demo Task",
      description: "Task to approve",
    });

    await taskManager.transitionTask(chain.id, task.id, "todo");
    await taskManager.startTask(chain.id, task.id);
    await taskManager.completeTask(chain.id, task.id);

    return { chain, task, taskManager };
  }

  it("approves a task and emits task:approved", async () => {
    const { chain, task, taskManager } = await createTaskInReview();
    const emitEvent = vi.fn().mockResolvedValue(undefined);

    const result = await approveTaskCommand(
      { chainManager, taskManager, emitEvent },
      { chainId: chain.id, taskId: task.id }
    );

    expect(result.success).toBe(true);
    expect(result.previousStatus).toBe("in-review");
    expect(result.newStatus).toBe("done");
    expect(result.requestId).toBe(chain.requestId);
    expect(result.event?.eventType).toBe("task:approved");

    const updated = await taskManager.getTask(chain.id, task.id);
    expect(updated?.status).toBe("done");

    const donePath = path.join(tempDir, "docs/tasks/done", chain.id, `${task.id}.md`);
    await expect(fs.stat(donePath)).resolves.toBeDefined();
    const reviewPath = path.join(tempDir, "docs/tasks/in-review", chain.id, `${task.id}.md`);
    await expect(fs.stat(reviewPath)).rejects.toThrow();

    expect(emitEvent).toHaveBeenCalledWith({
      eventType: "task:approved",
      entityType: "task",
      entityId: task.id,
      chainId: chain.id,
      requestId: chain.requestId,
      metadata: {
        previousStatus: "in-review",
        newStatus: "done",
      },
    });
  });

  it("fails gracefully when task is not in-review", async () => {
    const taskManager = chainManager.getTaskManager();
    const chain = await chainManager.createChain({
      requestId: "CR-003",
      slug: "approve-invalid",
      title: "Approve Invalid",
    });
    const task = await taskManager.createTask({
      chainId: chain.id,
      slug: "not-ready",
      title: "Not Ready",
      description: "Task still in todo",
    });
    await taskManager.transitionTask(chain.id, task.id, "todo");

    const emitEvent = vi.fn();

    const result = await approveTaskCommand(
      { chainManager, taskManager, emitEvent },
      { chainId: chain.id, taskId: task.id }
    );

    expect(result.success).toBe(false);
    expect(result.previousStatus).toBe("todo");
    expect(result.error).toContain("in-review");

    const persisted = await taskManager.getTask(chain.id, task.id);
    expect(persisted?.status).toBe("todo");
    expect(emitEvent).not.toHaveBeenCalled();
  });
});
