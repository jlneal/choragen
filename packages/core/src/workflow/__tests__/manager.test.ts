/**
 * @design-doc docs/design/core/features/workflow-orchestration.md
 * @user-intent "Validate WorkflowManager workflow CRUD, gate handling, persistence, and messaging"
 * @test-type unit
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { WorkflowManager, type WorkflowTemplate, type CommandResult } from "../manager.js";
import { loadWorkflowIndex, getWorkflowFilePath } from "../persistence.js";
import type { TaskStatus } from "../../tasks/types.js";

const SUCCESS_RESULT: CommandResult = { exitCode: 0, stdout: "", stderr: "" };

const baseTemplate: WorkflowTemplate = {
  name: "standard",
  stages: [
    {
      name: "Request",
      type: "request",
      gate: { type: "auto", satisfied: false },
    },
    {
      name: "Design",
      type: "design",
      gate: { type: "human_approval", prompt: "Approve design" },
    },
  ],
};

describe("WorkflowManager", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "workflow-manager-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const createManager = (options?: { chainStatus?: TaskStatus | null; commandResult?: CommandResult; }) => {
    return new WorkflowManager(tempDir, {
      chainStatusChecker: async () => options?.chainStatus ?? null,
      commandRunner: async () => options?.commandResult ?? SUCCESS_RESULT,
    });
  };

  it("creates and persists a workflow from a template", async () => {
    const manager = createManager();
    const workflow = await manager.create({ requestId: "CR-1", template: baseTemplate });

    const index = await loadWorkflowIndex(tempDir);
    const workflowPath = getWorkflowFilePath(tempDir, workflow.id);
    const stored = await fs.readFile(workflowPath, "utf-8");

    expect(workflow.id).toMatch(/^WF-\d{8}-\d{3}$/);
    expect(workflow.stages[0].status).toBe("awaiting_gate");
    expect(workflow.stages[0].gate.satisfied).toBe(true);
    expect(index.workflows[workflow.id]).toBeDefined();
    expect(JSON.parse(stored).id).toBe(workflow.id);
  });

  it("gets a workflow by id", async () => {
    const manager = createManager();
    const created = await manager.create({ requestId: "CR-2", template: baseTemplate });

    const loaded = await manager.get(created.id);

    expect(loaded).not.toBeNull();
    expect(loaded!.id).toBe(created.id);
    expect(loaded!.createdAt).toBeInstanceOf(Date);
  });

  it("lists workflows with filters", async () => {
    const manager = createManager();
    const wf1 = await manager.create({ requestId: "CR-3", template: baseTemplate });
    const wf2 = await manager.create({ requestId: "CR-4", template: baseTemplate });

    await manager.updateStatus(wf2.id, "paused");

    const active = await manager.list({ status: "active" });
    const paused = await manager.list({ status: "paused" });
    const filteredByRequest = await manager.list({ requestId: "CR-3" });

    expect(active.map((w) => w.id)).toContain(wf1.id);
    expect(paused).toHaveLength(1);
    expect(paused[0].id).toBe(wf2.id);
    expect(filteredByRequest).toHaveLength(1);
    expect(filteredByRequest[0].requestId).toBe("CR-3");
  });

  it("advances through an auto gate stage", async () => {
    const manager = createManager();
    const workflow = await manager.create({ requestId: "CR-5", template: baseTemplate });

    const advanced = await manager.advance(workflow.id);

    expect(advanced.currentStage).toBe(1);
    expect(advanced.stages[0].status).toBe("completed");
    expect(advanced.stages[1].status).toBe("active");
  });

  it("prevents advancing when human approval gate is not satisfied", async () => {
    const manager = createManager();
    const workflow = await manager.create({ requestId: "CR-6", template: baseTemplate });
    await manager.advance(workflow.id); // move to human gate stage

    await expect(manager.advance(workflow.id)).rejects.toThrow("Gate not satisfied");
  });

  it("satisfies a human gate and advances", async () => {
    const manager = createManager();
    const workflow = await manager.create({ requestId: "CR-7", template: baseTemplate });
    await manager.advance(workflow.id); // move to gate stage

    await manager.satisfyGate(workflow.id, 1, "approver");
    const advanced = await manager.advance(workflow.id);

    expect(advanced.status).toBe("completed");
    expect(advanced.stages[1].status).toBe("completed");
  });

  it("checks chain_complete gate before advancing", async () => {
    const chainTemplate: WorkflowTemplate = {
      name: "chain-complete",
      stages: [
        { name: "Impl", type: "implementation", gate: { type: "chain_complete", chainId: "CHAIN-123" } },
      ],
    };
    const manager = createManager({ chainStatus: "done" });

    const workflow = await manager.create({ requestId: "CR-8", template: chainTemplate });
    const advanced = await manager.advance(workflow.id);

    expect(advanced.status).toBe("completed");
    expect(advanced.stages[0].gate.satisfiedBy).toBe("system");
  });

  it("fails verification_pass gate when a command fails", async () => {
    const verificationTemplate: WorkflowTemplate = {
      name: "verify",
      stages: [
        { name: "Verify", type: "verification", gate: { type: "verification_pass", commands: ["echo ok"] } },
      ],
    };
    const manager = createManager({ commandResult: { exitCode: 1, stdout: "", stderr: "fail" } });

    const workflow = await manager.create({ requestId: "CR-9", template: verificationTemplate });

    await expect(manager.advance(workflow.id)).rejects.toThrow("Verification command failed");
  });

  it("runs verification_pass commands successfully", async () => {
    const verificationTemplate: WorkflowTemplate = {
      name: "verify",
      stages: [
        { name: "Verify", type: "verification", gate: { type: "verification_pass", commands: ["echo ok"] } },
      ],
    };
    const manager = createManager();

    const workflow = await manager.create({ requestId: "CR-10", template: verificationTemplate });
    const advanced = await manager.advance(workflow.id);

    expect(advanced.status).toBe("completed");
    expect(advanced.stages[0].gate.satisfied).toBe(true);
  });

  it("adds messages to workflow history", async () => {
    const manager = createManager();
    const workflow = await manager.create({ requestId: "CR-11", template: baseTemplate });

    const updated = await manager.addMessage(workflow.id, {
      role: "human",
      content: "Hello!",
      stageIndex: 0,
    });

    expect(updated.messages).toHaveLength(1);
    expect(updated.messages[0].id).toBeDefined();
    expect(updated.messages[0].timestamp).toBeInstanceOf(Date);
  });

  it("captures agent metadata including tool calls", async () => {
    const manager = createManager();
    const workflow = await manager.create({ requestId: "CR-12", template: baseTemplate });

    const toolCall = { name: "echo", args: { text: "hi" }, result: { success: true } };
    await manager.addMessage(workflow.id, {
      role: "impl",
      content: "Ran tool",
      stageIndex: 0,
      metadata: {
        toolCalls: [toolCall],
        sessionId: "session-123",
        streaming: false,
      },
    });

    const reloaded = await manager.get(workflow.id);
    expect(reloaded?.messages[0].metadata?.toolCalls?.[0]).toEqual(toolCall);
    expect(reloaded?.messages[0].metadata?.sessionId).toBe("session-123");
    expect(reloaded?.messages[0].metadata?.streaming).toBe(false);
    expect(reloaded?.messages[0].role).toBe("impl");
  });

  it("emits gate prompt when human approval stage becomes active on create", async () => {
    const template: WorkflowTemplate = {
      name: "gate",
      stages: [
        {
          name: "Approval",
          type: "request",
          gate: { type: "human_approval", prompt: "Please approve to start" },
        },
      ],
    };
    const manager = createManager();

    const workflow = await manager.create({ requestId: "CR-13", template });
    const promptMessage = workflow.messages[0];

    expect(promptMessage.role).toBe("system");
    expect(promptMessage.stageIndex).toBe(0);
    expect(promptMessage.metadata?.type).toBe("gate_prompt");
    expect(promptMessage.metadata?.prompt).toBe("Please approve to start");
    expect(promptMessage.content).toContain("Please approve to start");
  });

  it("emits gate prompt when advancing into a human approval stage", async () => {
    const template: WorkflowTemplate = {
      name: "gate-advance",
      stages: [
        { name: "Auto", type: "request", gate: { type: "auto" } },
        {
          name: "Approval",
          type: "design",
          gate: { type: "human_approval", prompt: "Approve design" },
        },
      ],
    };
    const manager = createManager();
    const workflow = await manager.create({ requestId: "CR-14", template });

    // Advance past auto stage into approval stage
    const advanced = await manager.advance(workflow.id);
    const messages = advanced.messages.filter(
      (msg) => msg.metadata?.type === "gate_prompt"
    );

    expect(messages).toHaveLength(1);
    expect(messages[0].stageIndex).toBe(1);
    expect(messages[0].metadata?.prompt).toBe("Approve design");
  });
});
