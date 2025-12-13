/**
 * @design-doc docs/design/core/features/standard-workflow.md
 * @test-type unit
 * @user-intent "Ensure workflow event emitter dispatches and handlers update state"
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { TaskManager } from "../../tasks/task-manager.js";
import { ChainManager } from "../../tasks/chain-manager.js";
import { WorkflowEventEmitter } from "../emitter.js";
import {
  createTaskSubmittedHandler,
  createChainApprovedHandler,
  createRequestApprovedHandler,
  createSpawnHandler,
} from "../handlers.js";

describe("workflow event hooks", () => {
  let tempDir: string;
  let taskManager: TaskManager;
  let chainManager: ChainManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-hooks-"));
    taskManager = new TaskManager(tempDir);
    chainManager = new ChainManager(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("invokes registered handler on emit", async () => {
    const emitter = new WorkflowEventEmitter();
    const handler = vi.fn();
    emitter.on("task:submitted", handler);

    await emitter.emit("task:submitted", {
      eventType: "task:submitted",
      chainId: "CHAIN-TEST",
      taskId: "001-demo",
      previousStatus: "in-progress",
      newStatus: "in-review",
    });

    expect(handler).toHaveBeenCalled();
  });

  it("updates task status via handler on task:submitted", async () => {
    const emitter = new WorkflowEventEmitter();
    const ctx = { projectRoot: tempDir, taskManager, chainManager };
    emitter.on("task:submitted", createTaskSubmittedHandler(ctx));

    const task = await taskManager.createTask({
      chainId: "CHAIN-001",
      slug: "demo-task",
      title: "Demo Task",
      description: "Test handler",
    });
    await taskManager.transitionTask("CHAIN-001", task.id, "todo");
    await taskManager.transitionTask("CHAIN-001", task.id, "in-progress");

    await emitter.emit("task:submitted", {
      eventType: "task:submitted",
      chainId: "CHAIN-001",
      taskId: task.id,
      previousStatus: "in-progress",
      newStatus: "in-review",
    });

    const updated = await taskManager.getTask("CHAIN-001", task.id);
    expect(updated?.status).toBe("in-review");

    const reviewPath = path.join(tempDir, "docs/tasks/in-review", "CHAIN-001", `${task.id}.md`);
    await expect(fs.stat(reviewPath)).resolves.toBeDefined();
  });

  it("updates chain review status on chain:approved", async () => {
    const emitter = new WorkflowEventEmitter();
    const ctx = { projectRoot: tempDir, taskManager, chainManager };
    emitter.on("chain:approved", createChainApprovedHandler(ctx));

    const chain = await chainManager.createChain({
      requestId: "CR-001",
      slug: "review-chain",
      title: "Review Chain",
    });

    await emitter.emit("chain:approved", {
      eventType: "chain:approved",
      chainId: chain.id,
      requestId: chain.requestId,
      newStatus: "approved",
    });

    const updated = await chainManager.getChain(chain.id);
    expect(updated?.reviewStatus).toBe("approved");
  });

  it("spawns agent via spawn handler", async () => {
    const emitter = new WorkflowEventEmitter();
    const spawnAgent = vi.fn();
    const ctx = { projectRoot: tempDir, taskManager, chainManager, spawnAgent };
    emitter.on("task:approved", createSpawnHandler(ctx, "review"));

    await emitter.emit("task:approved", {
      eventType: "task:approved",
      chainId: "CHAIN-002",
      taskId: "001-sample",
      previousStatus: "in-review",
      newStatus: "done",
    });

    expect(spawnAgent).toHaveBeenCalledWith("review", undefined);
  });

  it("persists request review status on request:approved", async () => {
    const emitter = new WorkflowEventEmitter();
    const ctx = { projectRoot: tempDir, taskManager, chainManager };
    emitter.on("request:approved", createRequestApprovedHandler(ctx));

    await emitter.emit("request:approved", {
      eventType: "request:approved",
      requestId: "CR-REQ-999",
      newStatus: "approved",
    });

    const metaPath = path.join(tempDir, ".choragen/requests/CR-REQ-999.json");
    const meta = JSON.parse(await fs.readFile(metaPath, "utf-8"));
    expect(meta.reviewStatus).toBe("approved");
  });
});
