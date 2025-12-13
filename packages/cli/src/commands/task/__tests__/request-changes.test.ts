/**
 * @design-doc docs/design/core/features/standard-workflow.md
 * @test-type unit
 * @user-intent "Request changes on a task after review"
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { ChainManager } from "@choragen/core";
import { requestChangesCommand } from "../request-changes.js";

describe("task:request_changes command", () => {
  let tempDir: string;
  let chainManager: ChainManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-task-request-"));
    chainManager = new ChainManager(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function createTaskInReview() {
    const taskManager = chainManager.getTaskManager();
    const chain = await chainManager.createChain({
      requestId: "CR-003",
      slug: "request-flow",
      title: "Request Flow",
    });
    const task = await taskManager.createTask({
      chainId: chain.id,
      slug: "demo-task",
      title: "Demo Task",
      description: "Task to request changes on",
    });

    await taskManager.transitionTask(chain.id, task.id, "todo");
    await taskManager.startTask(chain.id, task.id);
    await taskManager.completeTask(chain.id, task.id);

    return { chain, task, taskManager };
  }

  it("requests changes and emits task:changes_requested", async () => {
    const { chain, task, taskManager } = await createTaskInReview();
    const emitEvent = vi.fn().mockResolvedValue(undefined);
    const reason = "Add missing tests";

    const result = await requestChangesCommand(
      { chainManager, taskManager, emitEvent },
      { chainId: chain.id, taskId: task.id, reason }
    );

    expect(result.success).toBe(true);
    expect(result.previousStatus).toBe("in-review");
    expect(result.newStatus).toBe("in-progress");
    expect(result.requestId).toBe(chain.requestId);
    expect(result.event?.eventType).toBe("task:changes_requested");
    expect(result.event?.reason).toBe(reason);

    const updated = await taskManager.getTask(chain.id, task.id);
    expect(updated?.status).toBe("in-progress");

    const inProgressPath = path.join(
      tempDir,
      "docs/tasks/in-progress",
      chain.id,
      `${task.id}.md`
    );
    await expect(fs.stat(inProgressPath)).resolves.toBeDefined();
    const reviewPath = path.join(tempDir, "docs/tasks/in-review", chain.id, `${task.id}.md`);
    await expect(fs.stat(reviewPath)).rejects.toThrow();

    expect(emitEvent).toHaveBeenCalledWith({
      eventType: "task:changes_requested",
      entityType: "task",
      entityId: task.id,
      chainId: chain.id,
      requestId: chain.requestId,
      metadata: {
        previousStatus: "in-review",
        newStatus: "in-progress",
        reason,
      },
    });
  });

  it("fails gracefully when task is not in-review", async () => {
    const taskManager = chainManager.getTaskManager();
    const chain = await chainManager.createChain({
      requestId: "CR-003",
      slug: "request-invalid",
      title: "Request Invalid",
    });
    const task = await taskManager.createTask({
      chainId: chain.id,
      slug: "not-ready",
      title: "Not Ready",
      description: "Task still in todo",
    });
    await taskManager.transitionTask(chain.id, task.id, "todo");

    const emitEvent = vi.fn();
    const reason = "Need more details";

    const result = await requestChangesCommand(
      { chainManager, taskManager, emitEvent },
      { chainId: chain.id, taskId: task.id, reason }
    );

    expect(result.success).toBe(false);
    expect(result.previousStatus).toBe("todo");
    expect(result.error).toContain("in-review");

    const persisted = await taskManager.getTask(chain.id, task.id);
    expect(persisted?.status).toBe("todo");
    expect(emitEvent).not.toHaveBeenCalled();
  });
});
