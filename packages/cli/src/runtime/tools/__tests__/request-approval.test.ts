/**
 * @design-doc docs/design/core/features/ideation-workflow.md
 * @test-type unit
 * @user-intent "Ensure agent-triggered approval prompts can be requested via CLI tool"
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { WorkflowManager, type WorkflowTemplate } from "@choragen/core";
import { executeRequestApproval } from "../definitions/request-approval.js";
import type { ExecutionContext } from "../executor.js";

const templateMeta = () => ({
  builtin: false,
  version: 1,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
});

const agentTriggeredTemplate: WorkflowTemplate = {
  ...templateMeta(),
  name: "agent-triggered",
  stages: [
    {
      name: "Exploration",
      type: "ideation",
      gate: {
        type: "human_approval",
        prompt: "Continue?",
        agentTriggered: true,
      },
    },
  ],
};

const standardGateTemplate: WorkflowTemplate = {
  ...templateMeta(),
  name: "standard-gate",
  stages: [
    {
      name: "Approval",
      type: "ideation",
      gate: {
        type: "human_approval",
        prompt: "Approve?",
      },
    },
  ],
};

describe("request_approval tool", () => {
  let tempDir: string;
  let context: ExecutionContext;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "request-approval-"));
    context = { role: "impl", workspaceRoot: tempDir };
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("adds a gate prompt for agent-triggered gates", async () => {
    const manager = new WorkflowManager(tempDir);
    const workflow = await manager.create({ requestId: "FR-1", template: agentTriggeredTemplate });

    expect(workflow.messages).toHaveLength(0);

    const result = await executeRequestApproval({ workflowId: workflow.id }, context);
    expect(result.success).toBe(true);

    const updated = await manager.get(workflow.id);
    const prompts = updated?.messages.filter((msg) => msg.metadata?.type === "gate_prompt");
    expect(prompts?.length).toBe(1);
    expect(prompts?.[0].metadata?.prompt).toBe("Continue?");
  });

  it("fails for non agent-triggered gates", async () => {
    const manager = new WorkflowManager(tempDir);
    const workflow = await manager.create({ requestId: "FR-2", template: standardGateTemplate });

    const result = await executeRequestApproval({ workflowId: workflow.id }, context);
    expect(result.success).toBe(false);
    expect(result.error).toContain("agent-triggered human approval gate");
  });
});
