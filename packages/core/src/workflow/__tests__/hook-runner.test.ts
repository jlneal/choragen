/**
 * @design-doc docs/design/core/features/workflow-template-editor.md
 * @test-type unit
 * @user-intent "Verify TransitionHookRunner executes stage hooks correctly"
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { TransitionHookRunner, HookExecutionError } from "../hook-runner.js";
import type { StageTransitionHooks, TransitionAction, WorkflowStage } from "../types.js";
import { WorkflowManager, type WorkflowTemplate, type CommandResult } from "../manager.js";
import { TaskManager } from "../../tasks/task-manager.js";

const SUCCESS_RESULT: CommandResult = { exitCode: 0, stdout: "ok", stderr: "" };

function stageWithHooks(hooks: StageTransitionHooks, overrides: Partial<WorkflowStage> = {}): WorkflowStage {
  return {
    name: overrides.name ?? "Implementation",
    type: overrides.type ?? "implementation",
    status: overrides.status ?? "active",
    gate: overrides.gate ?? { type: "auto", satisfied: true },
    chainId: overrides.chainId,
    sessionId: overrides.sessionId,
    hooks,
    startedAt: overrides.startedAt,
    completedAt: overrides.completedAt,
  };
}

describe("TransitionHookRunner", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "hook-runner-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("runs onEnter hooks and returns results", async () => {
    const commands: string[] = [];
    const runner = new TransitionHookRunner(tempDir, {
      commandRunner: async (command) => {
        commands.push(command);
        return SUCCESS_RESULT;
      },
    });

    const hooks: StageTransitionHooks = { onEnter: [{ type: "command", command: "echo hello" }] };
    const stage = stageWithHooks(hooks);

    const result = await runner.runOnEnter(stage, { workflowId: "WF-1", stageIndex: 0 });

    expect(commands).toEqual(["echo hello"]);
    expect(result.results[0].details?.command?.stdout).toBe("ok");
  });

  it("captures command output", async () => {
    const runner = new TransitionHookRunner(tempDir, {
      commandRunner: async () => ({ exitCode: 0, stdout: "captured", stderr: "" }),
    });
    const hooks: StageTransitionHooks = { onExit: [{ type: "command", command: "echo hi" }] };
    const stage = stageWithHooks(hooks);

    const result = await runner.runOnExit(stage, { workflowId: "WF-2", stageIndex: 0 });

    expect(result.results[0].details?.command?.stdout).toBe("captured");
  });

  it("executes task_transition actions via TaskManager", async () => {
    const chainId = "CHAIN-123";
    const taskManager = new TaskManager(tempDir, { tasksPath: "tasks" });
    const task = await taskManager.createTask({
      chainId,
      slug: "sample",
      title: "Sample Task",
      description: "Test task transition",
    });
    await taskManager.transitionTask(chainId, task.id, "todo");

    const runner = new TransitionHookRunner(tempDir, { taskManager });
    const hooks: StageTransitionHooks = {
      onEnter: [
        { type: "task_transition", taskTransition: "start" },
        { type: "task_transition", taskTransition: "complete" },
      ],
    };
    const stage = stageWithHooks(hooks, { chainId });

    const result = await runner.runOnEnter(stage, { workflowId: "WF-3", stageIndex: 0, chainId, taskId: task.id });
    const updated = await taskManager.getTask(chainId, task.id);

    expect(updated?.status).toBe("in-review");
    expect(result.results).toHaveLength(2);
    expect(result.results.every((entry) => entry.success)).toBe(true);
  });

  it("moves files for file_move actions", async () => {
    const source = path.join(tempDir, "from.txt");
    const destination = path.join(tempDir, "moved", "to.txt");
    await fs.writeFile(source, "data", "utf-8");

    const hooks: StageTransitionHooks = { onExit: [{ type: "file_move", fileMove: { from: "from.txt", to: "moved/to.txt" } }] };
    const stage = stageWithHooks(hooks);
    const runner = new TransitionHookRunner(tempDir);

    const result = await runner.runOnExit(stage, { workflowId: "WF-4", stageIndex: 0 });
    const moved = await fs.readFile(destination, "utf-8");

    expect(result.results[0].success).toBe(true);
    expect(moved).toBe("data");
    await expect(fs.access(source)).rejects.toBeDefined();
  });

  it("executes custom actions from the registry", async () => {
    const handler = vi.fn().mockResolvedValue({ ok: true });
    const hooks: StageTransitionHooks = { onEnter: [{ type: "custom", handler: "demo" }] };
    const stage = stageWithHooks(hooks);
    const runner = new TransitionHookRunner(tempDir, { customHandlers: { demo: handler } });

    const result = await runner.runOnEnter(stage, { workflowId: "WF-5", stageIndex: 0 });

    expect(handler).toHaveBeenCalled();
    expect(result.results[0].details?.custom).toEqual({ ok: true });
  });

  it("continues when blocking is false but stops when true", async () => {
    const runner = new TransitionHookRunner(tempDir, {
      commandRunner: async (command) => (command === "fail" ? { exitCode: 1, stdout: "", stderr: "err" } : SUCCESS_RESULT),
    });
    const hooks: StageTransitionHooks = {
      onEnter: [
        { type: "command", command: "fail", blocking: false },
        { type: "command", command: "ok" },
      ],
    };
    const stage = stageWithHooks(hooks);

    const softResult = await runner.runOnEnter(stage, { workflowId: "WF-6", stageIndex: 0 });
    expect(softResult.results[0].success).toBe(false);
    expect(softResult.results[1].success).toBe(true);

    const hardHooks: StageTransitionHooks = { onExit: [{ type: "command", command: "fail" }] };
    const hardStage = stageWithHooks(hardHooks);

    await expect(runner.runOnExit(hardStage, { workflowId: "WF-7", stageIndex: 0 })).rejects.toBeInstanceOf(HookExecutionError);
  });
});

describe("WorkflowManager hook integration", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "workflow-manager-hooks-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("runs onExit before advancing and onEnter after", async () => {
    const order: string[] = [];
    const hookRunner = new TransitionHookRunner(tempDir, {
      customHandlers: {
        record: (_action: TransitionAction, context) => {
          order.push(`stage-${context.stageIndex}`);
          return context.stageIndex;
        },
      },
    });

    const templateMeta = {
      builtin: false,
      version: 1,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };
    const template: WorkflowTemplate = {
      ...templateMeta,
      name: "hook-order",
      stages: [
        {
          name: "One",
          type: "implementation",
          gate: { type: "auto" },
          hooks: { onExit: [{ type: "custom", handler: "record" }] },
        },
        {
          name: "Two",
          type: "verification",
          gate: { type: "auto" },
          hooks: { onEnter: [{ type: "custom", handler: "record" }] },
        },
      ],
    };

    const manager = new WorkflowManager(tempDir, { hookRunner });
    const workflow = await manager.create({ requestId: "CR-hooks", template });
    const advanced = await manager.advance(workflow.id);

    expect(order).toEqual(["stage-0", "stage-1"]);
    const hookMessages = advanced.messages.filter((msg) => msg.metadata?.type === "hook_results");
    expect(hookMessages).toHaveLength(2);
    expect(hookMessages[0].metadata?.hook).toBe("onExit");
    expect(hookMessages[1].metadata?.hook).toBe("onEnter");
    expect(advanced.currentStage).toBe(1);
    expect(advanced.stages[0].status).toBe("completed");
    expect(advanced.stages[1].status).toBe("active");
  });
});
