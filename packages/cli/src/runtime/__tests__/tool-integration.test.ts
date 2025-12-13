/**
 * @design-doc docs/adr/done/ADR-013-agent-tools-design.md
 * @test-type integration
 * @user-intent "Verify agent tools work correctly within workflow execution"
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { exec as childExec } from "node:child_process";
import { promisify } from "node:util";
import { TaskManager, ChainManager, saveWorkflow, loadWorkflow, type Workflow, RoleManager } from "@choragen/core";
import {
  executeTaskSubmit,
  executeTaskRequestChanges,
  executeTaskApprove,
  executeChainApprove,
  executeChainRequestChanges,
  executeRequestCreate,
  executeRequestApprove,
  executeFeedbackCreate,
  executeSpawnAgent,
  executeGitStatus,
  executeGitDiff,
  executeGitCommit,
} from "../tools/index.js";
import { GovernanceGate } from "../governance-gate.js";
import type { ExecutionContext, NestedSessionContext } from "../tools/executor.js";
import { ToolRegistry } from "../tools/registry.js";

const exec = promisify(childExec);

function createRoleManager(map: Record<string, string[]>): RoleManager {
  return {
    get: vi.fn(async (roleId: string) => {
      const toolIds = map[roleId];
      if (!toolIds) return null;
      return {
        id: roleId,
        name: roleId,
        toolIds,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),
  } as unknown as RoleManager;
}

function buildWorkflow(): Workflow {
  return {
    id: "wf-001",
    requestId: "CR-123",
    template: "test",
    currentStage: 0,
    status: "active",
    stages: [
      {
        name: "implementation",
        type: "implementation",
        status: "active",
        gate: { type: "auto", satisfied: true },
      },
    ],
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function initRepo(cwd: string): Promise<void> {
  await exec("git init", { cwd });
  await exec('git config user.email "test@example.com"', { cwd });
  await exec('git config user.name "Test User"', { cwd });
}

describe("Tool Integration Tests", () => {
  let tempDir: string;
  let events: Array<{ type: string; payload?: Record<string, unknown> }>;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-int-"));
    events = [];
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("Task lifecycle", () => {
    it("submit → approve flow emits events and transitions", async () => {
      const taskManager = new TaskManager(tempDir);
      const chainManager = new ChainManager(tempDir);
      const chain = await chainManager.createChain({
        requestId: "CR-1",
        slug: "demo",
        title: "Demo Chain",
      });
      const task = await taskManager.createTask({
        chainId: chain.id,
        slug: "demo-task",
        title: "Demo Task",
        description: "desc",
      });
      await taskManager.transitionTask(chain.id, task.id, "todo");
      await taskManager.startTask(chain.id, task.id);

      const context: ExecutionContext = {
        role: "impl",
        workspaceRoot: tempDir,
        eventEmitter: (event) => {
          events.push(event);
        },
      };

      const submitResult = await executeTaskSubmit(
        { chainId: chain.id, taskId: task.id, summary: "done" },
        context
      );
      expect(submitResult.success).toBe(true);
      expect(events.find((e) => e.type === "task.submitted")).toBeDefined();

      const approveResult = await executeTaskApprove(
        { chainId: chain.id, taskId: task.id },
        { ...context, role: "control" }
      );
      expect(approveResult.success).toBe(true);
      const approved = await taskManager.getTask(chain.id, task.id);
      expect(approved?.status).toBe("done");
    });

    it("submit → request_changes → resubmit flow", async () => {
      const taskManager = new TaskManager(tempDir);
      const chain = await new ChainManager(tempDir).createChain({
        requestId: "CR-2",
        slug: "demo2",
        title: "Demo Chain 2",
      });
      const task = await taskManager.createTask({
        chainId: chain.id,
        slug: "demo-task-2",
        title: "Demo Task 2",
        description: "desc",
      });
      await taskManager.transitionTask(chain.id, task.id, "todo");
      await taskManager.startTask(chain.id, task.id);
      await executeTaskSubmit({ chainId: chain.id, taskId: task.id }, { role: "impl", workspaceRoot: tempDir });

      const rcResult = await executeTaskRequestChanges(
        { chainId: chain.id, taskId: task.id, reason: "fix" },
        { role: "control", workspaceRoot: tempDir }
      );
      expect(rcResult.success).toBe(true);
      const reopened = await taskManager.getTask(chain.id, task.id);
      expect(reopened?.status).toBe("in-progress");
    });
  });

  describe("Chain lifecycle", () => {
    it("approves chain after tasks done", async () => {
      const chainManager = new ChainManager(tempDir);
      const chain = await chainManager.createChain({
        requestId: "CR-3",
        slug: "chain3",
        title: "Chain 3",
      });
      const taskManager = chainManager.getTaskManager();
      const task = await taskManager.createTask({
        chainId: chain.id,
        slug: "task3",
        title: "Task 3",
        description: "desc",
      });
      await taskManager.transitionTask(chain.id, task.id, "todo");
      await taskManager.startTask(chain.id, task.id);
      await taskManager.completeTask(chain.id, task.id);
      await taskManager.approveTask(chain.id, task.id);

      const context: ExecutionContext = {
        role: "control",
        workspaceRoot: tempDir,
        eventEmitter: (event) => { events.push(event); },
      };
      const result = await executeChainApprove({ chainId: chain.id }, context);
      expect(result.success).toBe(true);
      expect(events.find((e) => e.type === "chain.approved")).toBeDefined();
    });

    it("requests changes on chain", async () => {
      const chain = await new ChainManager(tempDir).createChain({
        requestId: "CR-4",
        slug: "chain4",
        title: "Chain 4",
      });
      const result = await executeChainRequestChanges(
        { chainId: chain.id, reason: "update" },
        { role: "control", workspaceRoot: tempDir, eventEmitter: (e) => { events.push(e); } }
      );
      expect(result.success).toBe(true);
      expect(events.find((e) => e.type === "chain.changes_requested")).toBeDefined();
    });
  });

  describe("Request lifecycle", () => {
    beforeEach(async () => {
      const templateDir = path.join(tempDir, "templates");
      await fs.mkdir(templateDir, { recursive: true });
      const projectTemplates = path.join(process.cwd(), "..", "..", "templates");
      await fs.copyFile(path.join(projectTemplates, "change-request.md"), path.join(templateDir, "change-request.md"));
      await fs.copyFile(path.join(projectTemplates, "fix-request.md"), path.join(templateDir, "fix-request.md"));
    });

    it("create → approve flow", async () => {
      const create = await executeRequestCreate(
        { type: "cr", title: "Req1", domain: "platform", content: "desc" },
        { role: "control", workspaceRoot: tempDir, eventEmitter: (e) => { events.push(e); } }
      );
      expect(create.success).toBe(true);
      const requestId = (create.data as { requestId: string }).requestId;
      expect(events.find((e) => e.type === "request.created")).toBeDefined();

      const approve = await executeRequestApprove(
        { requestId },
        { role: "control", workspaceRoot: tempDir, eventEmitter: (e) => { events.push(e); } }
      );
      expect(approve.success).toBe(true);
      expect(events.find((e) => e.type === "request.approved")).toBeDefined();
    });
  });

  describe("Feedback", () => {
    beforeEach(async () => {
      await saveWorkflow(tempDir, buildWorkflow());
    });

    it("creates blocking feedback and pauses workflow", async () => {
      const result = await executeFeedbackCreate(
        { workflowId: "wf-001", question: "Need approval", blocking: true },
        { role: "impl", workspaceRoot: tempDir, eventEmitter: (e) => { events.push(e); } }
      );
      expect(result.success).toBe(true);
      const workflow = await loadWorkflow(tempDir, "wf-001");
      expect(workflow?.status).toBe("paused");
      expect(events.find((e) => e.type === "feedback.created")).toBeDefined();
    });

    it("creates non-blocking feedback and keeps workflow active", async () => {
      const result = await executeFeedbackCreate(
        { workflowId: "wf-001", question: "Optional feedback", blocking: false },
        { role: "impl", workspaceRoot: tempDir, eventEmitter: (e) => { events.push(e); } }
      );
      expect(result.success).toBe(true);
      const workflow = await loadWorkflow(tempDir, "wf-001");
      expect(workflow?.status).toBe("active");
    });
  });

  describe("Spawn agent", () => {
    it("spawns allowed role", async () => {
      const spawnChildSession = vi.fn(async () => ({
        success: true,
        sessionId: "child-1",
        iterations: 1,
        tokensUsed: { input: 10, output: 5 },
        summary: "done",
      }));
      const ctx: NestedSessionContext = {
        role: "control",
        workspaceRoot: tempDir,
        sessionId: "parent",
        nestingDepth: 0,
        maxNestingDepth: 2,
        spawnChildSession,
      };
      const result = await executeSpawnAgent(
        { role: "impl", chainId: "CHAIN-1", taskId: "001-task", context: "Do work" },
        ctx
      );
      expect(result.success).toBe(true);
      expect(spawnChildSession).toHaveBeenCalledWith(
        expect.objectContaining({ role: "impl", chainId: "CHAIN-1", taskId: "001-task" })
      );
    });

    it("rejects privilege escalation", async () => {
      const ctx: NestedSessionContext = {
        role: "impl",
        workspaceRoot: tempDir,
        sessionId: "parent",
        nestingDepth: 0,
        maxNestingDepth: 1,
      };
      const result = await executeSpawnAgent({ role: "control" }, ctx);
      expect(result.success).toBe(false);
      expect(result.error).toContain("cannot spawn");
    });
  });

  describe("Git tools", () => {
    beforeEach(async () => {
      await initRepo(tempDir);
    });

    it("status → diff → commit flow", async () => {
      const ctx: ExecutionContext = { role: "control", workspaceRoot: tempDir };
      const status = await executeGitStatus({}, ctx);
      expect(status.success).toBe(true);

      await fs.writeFile(path.join(tempDir, "file.txt"), "hello");
      const diff = await executeGitDiff({ files: ["file.txt"] }, ctx);
      expect(diff.success).toBe(true);

      const commit = await executeGitCommit(
        { message: "chore(test): add file\n\n[CR-20250101-004]", files: ["file.txt"] },
        ctx
      );
      expect(commit.success).toBe(true);
    });
  });

  describe("Role-based access", () => {
    it("denies tool when role lacks permission", async () => {
      const registry = new ToolRegistry();
      const gate = new GovernanceGate(registry, null);
      const roleManager = createRoleManager({
        implementer: ["task:start"],
      });

      const result = await gate.validateWithRoleId(
        { name: "task:approve", params: {} },
        "implementer",
        roleManager
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Tool not allowed");
    });
  });

  describe("Event emission", () => {
    it("captures events emitted by tools", async () => {
      const taskManager = new TaskManager(tempDir);
      const chain = await new ChainManager(tempDir).createChain({
        requestId: "CR-5",
        slug: "chain5",
        title: "Chain 5",
      });
      const task = await taskManager.createTask({
        chainId: chain.id,
        slug: "task5",
        title: "Task 5",
        description: "desc",
      });
      await taskManager.transitionTask(chain.id, task.id, "todo");
      await taskManager.startTask(chain.id, task.id);
      await executeTaskSubmit(
        { chainId: chain.id, taskId: task.id },
        { role: "impl", workspaceRoot: tempDir, eventEmitter: (e) => { events.push(e); } }
      );
      expect(events.some((e) => e.type === "task.submitted")).toBe(true);
    });
  });
});
