/**
 * @design-doc docs/design/core/features/standard-workflow.md
 * @test-type unit
 * @user-intent "Request changes on a chain after review"
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { ChainManager } from "@choragen/core";
import { requestChainChangesCommand } from "../request-changes.js";

describe("chain:request_changes command", () => {
  let tempDir: string;
  let chainManager: ChainManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-chain-request-"));
    chainManager = new ChainManager(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function createChainWithDoneTasks() {
    const taskManager = chainManager.getTaskManager();
    const chain = await chainManager.createChain({
      requestId: "CR-004",
      slug: "chain-request",
      title: "Chain Request Changes",
    });

    const task = await taskManager.createTask({
      chainId: chain.id,
      slug: "task-1",
      title: "Task 1",
      description: "Done task",
    });
    await taskManager.transitionTask(chain.id, task.id, "todo");
    await taskManager.startTask(chain.id, task.id);
    await taskManager.completeTask(chain.id, task.id);
    await taskManager.approveTask(chain.id, task.id);

    return { chain, taskManager };
  }

  it("requests changes and emits chain:changes_requested", async () => {
    const { chain } = await createChainWithDoneTasks();
    const emitEvent = vi.fn().mockResolvedValue(undefined);
    const reason = "Clarify design scope";

    const result = await requestChainChangesCommand(
      { chainManager, emitEvent },
      { chainId: chain.id, reason }
    );

    expect(result.success).toBe(true);
    expect(result.reviewStatus).toBe("changes_requested");

    const updated = await chainManager.getChain(chain.id);
    expect(updated?.reviewStatus).toBe("changes_requested");

    expect(emitEvent).toHaveBeenCalledWith({
      eventType: "chain:changes_requested",
      entityType: "chain",
      entityId: chain.id,
      requestId: chain.requestId,
      metadata: {
        reviewStatus: "changes_requested",
        reason,
      },
    });
  });

  it("fails when tasks are not all done", async () => {
    const taskManager = chainManager.getTaskManager();
    const chain = await chainManager.createChain({
      requestId: "CR-004",
      slug: "chain-request-fail",
      title: "Chain Request Fail",
    });
    const task = await taskManager.createTask({
      chainId: chain.id,
      slug: "task-1",
      title: "Task 1",
      description: "Not finished",
    });
    await taskManager.transitionTask(chain.id, task.id, "todo");

    const emitEvent = vi.fn();

    const result = await requestChainChangesCommand(
      { chainManager, emitEvent },
      { chainId: chain.id, reason: "Need more work" }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("All tasks must be done");
    expect(emitEvent).not.toHaveBeenCalled();
  });

  it("fails when reason is missing", async () => {
    const { chain } = await createChainWithDoneTasks();
    const emitEvent = vi.fn();

    const result = await requestChainChangesCommand(
      { chainManager, emitEvent },
      { chainId: chain.id, reason: "" }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Reason is required");
    expect(emitEvent).not.toHaveBeenCalled();
  });
});
