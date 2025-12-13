/**
 * @design-doc docs/design/core/features/standard-workflow.md
 * @test-type unit
 * @user-intent "Approve a chain after all tasks are done"
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { ChainManager } from "@choragen/core";
import { approveChainCommand } from "../approve.js";

describe("chain:approve command", () => {
  let tempDir: string;
  let chainManager: ChainManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-chain-approve-"));
    chainManager = new ChainManager(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function createChainWithDoneTasks(count: number) {
    const taskManager = chainManager.getTaskManager();
    const chain = await chainManager.createChain({
      requestId: "CR-004",
      slug: "chain-approve",
      title: "Chain Approve",
    });

    for (let i = 0; i < count; i++) {
      const task = await taskManager.createTask({
        chainId: chain.id,
        slug: `task-${i + 1}`,
        title: `Task ${i + 1}`,
        description: "Done task",
      });
      await taskManager.transitionTask(chain.id, task.id, "todo");
      await taskManager.startTask(chain.id, task.id);
      await taskManager.completeTask(chain.id, task.id);
      await taskManager.approveTask(chain.id, task.id);
    }

    return { chain, taskManager };
  }

  it("approves a chain and emits chain:approved", async () => {
    const { chain } = await createChainWithDoneTasks(2);
    const emitEvent = vi.fn().mockResolvedValue(undefined);

    const result = await approveChainCommand(
      { chainManager, emitEvent },
      { chainId: chain.id }
    );

    expect(result.success).toBe(true);
    expect(result.reviewStatus).toBe("approved");

    const updated = await chainManager.getChain(chain.id);
    expect(updated?.reviewStatus).toBe("approved");

    expect(emitEvent).toHaveBeenCalledWith({
      eventType: "chain:approved",
      entityType: "chain",
      entityId: chain.id,
      requestId: chain.requestId,
      metadata: { reviewStatus: "approved" },
    });
  });

  it("fails when not all tasks are done", async () => {
    const taskManager = chainManager.getTaskManager();
    const chain = await chainManager.createChain({
      requestId: "CR-004",
      slug: "chain-approve-fail",
      title: "Chain Approve Fail",
    });
    const task = await taskManager.createTask({
      chainId: chain.id,
      slug: "task-1",
      title: "Task 1",
      description: "Not finished",
    });
    await taskManager.transitionTask(chain.id, task.id, "todo");

    const emitEvent = vi.fn();

    const result = await approveChainCommand(
      { chainManager, emitEvent },
      { chainId: chain.id }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("All tasks must be done");
    expect(emitEvent).not.toHaveBeenCalled();
  });
});
