/**
 * @design-doc docs/design/core/features/agent-feedback.md
 * @user-intent "Agents can create structured feedback via tool call with validation"
 * @test-type unit
 */

import { beforeEach, describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import {
  executeFeedbackCreate,
  feedbackCreateTool,
  type FeedbackCreateContext,
} from "../feedback-create.js";
import { FeedbackManager } from "../../feedback/FeedbackManager.js";
import { saveWorkflow } from "../../workflow/persistence.js";
import type { Workflow, WorkflowStage } from "../../workflow/types.js";

describe("feedback:create tool", () => {
  let projectRoot: string;
  let context: FeedbackCreateContext;

  beforeEach(async () => {
    projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "feedback-tool-"));
    context = { projectRoot, roleId: "impl" };
  });

  it("creates feedback with validation and persistence using FeedbackManager", async () => {
    await createWorkflow(projectRoot, "WF-100", 1);

    const params = {
      workflowId: "WF-100",
      type: "clarification",
      content: "Need clarification on acceptance criteria",
      context: {
        files: ["docs/design/core/features/agent-feedback.md"],
        codeSnippets: [
          {
            file: "src/feature.ts",
            startLine: 10,
            endLine: 20,
            content: "function example() {}",
          },
        ],
        options: [
          {
            label: "option-a",
            description: "Proceed with implementation",
            recommended: true,
          },
          {
            label: "option-b",
            description: "Pause and request approval",
          },
        ],
      },
      priority: "high",
    };

    const result = await executeFeedbackCreate(params, context);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.feedbackId).toMatch(/^FB-/);
    expect(result.data.priority).toBe("high");
    expect(result.data.status).toBe("pending");

    const manager = new FeedbackManager(projectRoot);
    const stored = await manager.get(result.data.feedbackId, "WF-100");
    expect(stored?.content).toBe(params.content);
    expect(stored?.stageIndex).toBe(1);
    expect(stored?.context?.files).toEqual(params.context.files);
    expect(stored?.context?.codeSnippets?.[0].file).toBe("src/feature.ts");
    expect(stored?.context?.options?.[0].recommended).toBe(true);
  });

  it("applies default priority based on feedback type", async () => {
    await createWorkflow(projectRoot, "WF-200", 0);
    const result = await executeFeedbackCreate(
      {
        workflowId: "WF-200",
        type: "blocker",
        content: "Build is failing on main",
      },
      context
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    const manager = new FeedbackManager(projectRoot);
    const stored = await manager.get(result.data.feedbackId, "WF-200");
    expect(stored?.priority).toBe("critical");
  });

  it("returns validation errors for invalid payloads", async () => {
    const result = await executeFeedbackCreate(
      {
        workflowId: "",
        type: "unknown",
        content: "",
      },
      context
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toBe("Invalid feedback parameters");
    expect(result.details).toBeDefined();
  });

  it("fails when workflow does not exist", async () => {
    const result = await executeFeedbackCreate(
      {
        workflowId: "WF-missing",
        type: "idea",
        content: "We could improve logging",
      },
      context
    );

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error).toContain("Workflow not found");
  });

  it("exposes a JSON schema for tool metadata", () => {
    expect(feedbackCreateTool.parameters).toBeDefined();
    expect(feedbackCreateTool.parameters.required).toEqual(
      expect.arrayContaining(["workflowId", "type", "content"])
    );
  });
});

async function createWorkflow(
  projectRoot: string,
  workflowId: string,
  currentStage: number
): Promise<void> {
  const now = new Date();
  const stage: WorkflowStage = {
    name: "Implementation",
    type: "implementation",
    status: "active",
    gate: {
      type: "auto",
      satisfied: true,
      satisfiedAt: now,
    },
  };

  const workflow: Workflow = {
    id: workflowId,
    requestId: "CR-test",
    template: "standard",
    currentStage,
    status: "active",
    stages: [stage],
    messages: [],
    createdAt: now,
    updatedAt: now,
  };

  await saveWorkflow(projectRoot, workflow);
}
