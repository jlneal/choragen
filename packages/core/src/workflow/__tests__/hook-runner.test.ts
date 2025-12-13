/**
 * @design-doc docs/design/core/features/workflow-template-editor.md
 * @test-type unit
 * @user-intent "Verify TransitionHookRunner executes stage hooks correctly"
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { TransitionHookRunner, HookExecutionError, interpolateTemplate, type HookRunResult } from "../hook-runner.js";
import type { StageTransitionHooks, TransitionAction, WorkflowStage } from "../types.js";
import { WorkflowManager, type WorkflowTemplate, type CommandResult } from "../manager.js";
import { TaskManager } from "../../tasks/task-manager.js";
import type { Task, Chain } from "../../tasks/types.js";

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

  it("posts messages via injected messagePoster", async () => {
    const posted: unknown[] = [];
    const messagePoster = vi.fn().mockImplementation(async (message, context) => {
      posted.push({ message, context });
      return { id: "msg-1" };
    });
    const hooks: StageTransitionHooks = {
      onEnter: [{ type: "post_message", target: "orchestrator", content: "hello", metadata: { foo: "bar" } }],
    };
    const stage = stageWithHooks(hooks);
    const runner = new TransitionHookRunner(tempDir, { messagePoster });

    const context = { workflowId: "WF-8", stageIndex: 0 };
    const result = await runner.runOnEnter(stage, context);

    expect(messagePoster).toHaveBeenCalledWith(
      { target: "orchestrator", content: "hello", metadata: { foo: "bar" } },
      context
    );
    expect(result.results[0].success).toBe(true);
    expect(result.results[0].details?.postMessage?.target).toBe("orchestrator");
    expect(result.results[0].details?.postMessage?.content).toBe("hello");
    expect(result.results[0].details?.postMessage?.metadata).toEqual({ foo: "bar" });
    expect(result.results[0].details?.postMessage?.result).toEqual({ id: "msg-1" });
    expect(posted).toHaveLength(1);
  });

  it("fails when messagePoster is not configured", async () => {
    const hooks: StageTransitionHooks = { onEnter: [{ type: "post_message", target: "control", content: "ping" }] };
    const stage = stageWithHooks(hooks);
    const runner = new TransitionHookRunner(tempDir);

    await expect(runner.runOnEnter(stage, { workflowId: "WF-9", stageIndex: 0 })).rejects.toBeInstanceOf(HookExecutionError);
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

  it("interpolates variables in action strings", async () => {
    const recorded: string[] = [];
    const runner = new TransitionHookRunner(tempDir, {
      commandRunner: async (command) => {
        recorded.push(command);
        return SUCCESS_RESULT;
      },
    });

    const hooks: StageTransitionHooks = { onEnter: [{ type: "command", command: "echo {{workflowId}} {{stageIndex}} {{taskId}} {{chainId}}" }] };
    const stage = stageWithHooks(hooks, { chainId: "CHAIN-77" });

    await runner.runOnEnter(stage, { workflowId: "WF-77", stageIndex: 2, taskId: "TASK-9", chainId: "CHAIN-77" });

    expect(recorded[0]).toBe("echo WF-77 2 TASK-9 CHAIN-77");
  });

  it("leaves unknown variables unchanged", () => {
    const result = interpolateTemplate("hello {{unknown}}", { workflowId: "WF-1", stageIndex: 0 });
    expect(result).toBe("hello {{unknown}}");
  });

  it("runs task hooks with interpolation", async () => {
    const commands: string[] = [];
    const runner = new TransitionHookRunner(tempDir, {
      commandRunner: async (command) => {
        commands.push(command);
        return SUCCESS_RESULT;
      },
    });
    const task: Task = {
      id: "TASK-123",
      sequence: 1,
      slug: "demo",
      status: "todo",
      chainId: "CHAIN-1",
      title: "Demo task",
      description: "Test task hook",
      expectedFiles: [],
      acceptance: [],
      constraints: [],
      notes: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      hooks: { onStart: [{ type: "command", command: "echo {{taskId}} {{chainId}}" }] },
    };

    const result = await runner.runTaskHook("onStart", task, { workflowId: "WF-TA", stageIndex: 0 });

    expect(commands).toEqual(["echo TASK-123 CHAIN-1"]);
    expect(result.results[0].success).toBe(true);
    expect(result.taskId).toBe("TASK-123");
    expect(result.chainId).toBe("CHAIN-1");
  });

  it("runs chain hooks", async () => {
    const handler = vi.fn().mockResolvedValue({ ok: true });
    const chain: Chain = {
      id: "CHAIN-55",
      sequence: 1,
      slug: "chain-demo",
      requestId: "CR-1",
      title: "Demo chain",
      description: "Test chain hooks",
      tasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      hooks: { onComplete: [{ type: "custom", handler: "record" }] },
    };
    const runner = new TransitionHookRunner(tempDir, { customHandlers: { record: handler } });

    const result = await runner.runChainHook("onComplete", chain, { workflowId: "WF-CH", stageIndex: 1 });

    expect(handler).toHaveBeenCalled();
    expect(result.results[0].success).toBe(true);
    expect(result.chainId).toBe("CHAIN-55");
  });

  it("logs hook executions for task and chain hooks", async () => {
    const logger = vi.fn();
    const runner = new TransitionHookRunner(tempDir, {
      logger,
      commandRunner: async () => SUCCESS_RESULT,
      customHandlers: { noop: () => ({ ok: true }) },
    });

    const task: Task = {
      id: "TASK-LOG",
      sequence: 1,
      slug: "log",
      status: "todo",
      chainId: "CHAIN-LOG",
      title: "Log task hook",
      description: "",
      expectedFiles: [],
      acceptance: [],
      constraints: [],
      notes: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      hooks: { onStart: [{ type: "command", command: "echo hi" }] },
    };
    const chain: Chain = {
      id: "CHAIN-LOG",
      sequence: 1,
      slug: "log-chain",
      requestId: "CR-LOG",
      title: "Log chain hook",
      description: "",
      tasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      hooks: { onComplete: [{ type: "custom", handler: "noop" }] },
    };

    await runner.runTaskHook("onStart", task, { workflowId: "WF-LOG", stageIndex: 0 });
    await runner.runChainHook("onComplete", chain, { workflowId: "WF-LOG", stageIndex: 0 });

    expect(logger).toHaveBeenCalledTimes(2);
    const [taskCall, chainCall] = logger.mock.calls as [[HookRunResult], [HookRunResult]];
    expect(taskCall[0].hook).toBe("onStart");
    expect(taskCall[0].taskId).toBe("TASK-LOG");
    expect(taskCall[0].results[0].action.type).toBe("command");
    expect(chainCall[0].hook).toBe("onComplete");
    expect(chainCall[0].chainId).toBe("CHAIN-LOG");
    expect(chainCall[0].results[0].action.type).toBe("custom");
  });

  it("logs and throws on blocking failures", async () => {
    const logger = vi.fn();
    const runner = new TransitionHookRunner(tempDir, {
      logger,
      commandRunner: async () => ({ exitCode: 1, stdout: "", stderr: "fail" }),
    });
    const hooks: StageTransitionHooks = { onEnter: [{ type: "command", command: "fail" }] };
    const stage = stageWithHooks(hooks);

    await expect(runner.runOnEnter(stage, { workflowId: "WF-FAIL", stageIndex: 0 })).rejects.toBeInstanceOf(HookExecutionError);
    expect(logger).toHaveBeenCalledTimes(1);
    const [result] = logger.mock.calls[0] as [HookRunResult];
    expect(result.hook).toBe("onEnter");
    expect(result.stageName).toBe(stage.name);
    expect(result.results[0].success).toBe(false);
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

  it("emits events via injected eventEmitter", async () => {
    const emitted: unknown[] = [];
    const eventEmitter = vi.fn().mockImplementation(async (event, context) => {
      emitted.push({ event, context });
      return { delivered: true };
    });
    const hooks: StageTransitionHooks = {
      onExit: [{ type: "emit_event", eventType: "task:completed", payload: { taskId: "T-1" } }],
    };
    const stage = stageWithHooks(hooks);
    const context = { workflowId: "WF-10", stageIndex: 1 };
    const runner = new TransitionHookRunner(tempDir, { eventEmitter });

    const result = await runner.runOnExit(stage, context);

    expect(eventEmitter).toHaveBeenCalledWith({ eventType: "task:completed", payload: { taskId: "T-1" } }, context);
    expect(result.results[0].success).toBe(true);
    expect(result.results[0].details?.emitEvent?.eventType).toBe("task:completed");
    expect(result.results[0].details?.emitEvent?.payload).toEqual({ taskId: "T-1" });
    expect(result.results[0].details?.emitEvent?.result).toEqual({ delivered: true });
    expect(emitted).toHaveLength(1);
  });

  it("fails when eventEmitter is not configured", async () => {
    const hooks: StageTransitionHooks = { onExit: [{ type: "emit_event", eventType: "chain:approved" }] };
    const stage = stageWithHooks(hooks);
    const runner = new TransitionHookRunner(tempDir);

    await expect(runner.runOnExit(stage, { workflowId: "WF-11", stageIndex: 2 })).rejects.toBeInstanceOf(HookExecutionError);
  });

  it("spawns agents via injected agentSpawner", async () => {
    const spawnCalls: unknown[] = [];
    const agentSpawner = vi.fn().mockImplementation(async (action, context) => {
      spawnCalls.push({ action, context });
      return { sessionId: "S-123" };
    });
    const hooks: StageTransitionHooks = {
      onEnter: [{ type: "spawn_agent", role: "implementation", context: { taskId: "T-99", chainId: "C-1" } }],
    };
    const stage = stageWithHooks(hooks);
    const context = { workflowId: "WF-12", stageIndex: 0 };
    const runner = new TransitionHookRunner(tempDir, { agentSpawner });

    const result = await runner.runOnEnter(stage, context);

    expect(agentSpawner).toHaveBeenCalledWith({ role: "implementation", context: { taskId: "T-99", chainId: "C-1" } }, context);
    expect(result.results[0].success).toBe(true);
    expect(result.results[0].details?.spawnAgent?.role).toBe("implementation");
    expect(result.results[0].details?.spawnAgent?.context).toEqual({ taskId: "T-99", chainId: "C-1" });
    expect(result.results[0].details?.spawnAgent?.sessionId).toBe("S-123");
    expect(result.results[0].details?.spawnAgent?.result).toEqual({ sessionId: "S-123" });
    expect(spawnCalls).toHaveLength(1);
  });

  it("fails when agentSpawner is not configured", async () => {
    const hooks: StageTransitionHooks = { onEnter: [{ type: "spawn_agent", role: "review" }] };
    const stage = stageWithHooks(hooks);
    const runner = new TransitionHookRunner(tempDir);

    await expect(runner.runOnEnter(stage, { workflowId: "WF-13", stageIndex: 0 })).rejects.toBeInstanceOf(HookExecutionError);
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
