/**
 * @design-doc docs/design/core/features/agent-feedback.md
 * @user-intent "Block workflow advancement when blocker feedback is unresolved"
 * @test-type integration
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { WorkflowManager } from "../manager.js";
import { FeedbackManager } from "../../feedback/FeedbackManager.js";
import type { WorkflowTemplate } from "../templates.js";

describe("blocker feedback integration", () => {
  let projectRoot: string;
  let workflowManager: WorkflowManager;
  let feedbackManager: FeedbackManager;

  beforeEach(async () => {
    projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "blocker-feedback-"));
    workflowManager = new WorkflowManager(projectRoot);
    feedbackManager = new FeedbackManager(projectRoot);
  });

  it("prevents advancement when blocker is pending or acknowledged", async () => {
    const workflow = await createWorkflow(projectRoot, workflowManager);
    const blocker = await feedbackManager.create({
      workflowId: workflow.id,
      stageIndex: 0,
      type: "blocker",
      createdByRole: "impl",
      content: "Build failing",
    });

    await expect(workflowManager.advance(workflow.id)).rejects.toThrow("unresolved blockers");

    const reloaded = await workflowManager.get(workflow.id);
    expect(reloaded?.blockingFeedbackIds).toEqual([blocker.id]);
    expect(reloaded?.currentStage).toBe(0);
  });

  it("allows advancement after blocker is resolved", async () => {
    const workflow = await createWorkflow(projectRoot, workflowManager);
    const blocker = await feedbackManager.create({
      workflowId: workflow.id,
      stageIndex: 0,
      type: "blocker",
      createdByRole: "impl",
      content: "Need approval",
    });

    await feedbackManager.respond(blocker.id, {
      content: "Approved",
      respondedBy: "human",
    });

    const advanced = await workflowManager.advance(workflow.id);
    expect(advanced.currentStage).toBe(1);
    expect(advanced.blockingFeedbackIds).toEqual([]);
  });

  it("allows advancement after blocker is dismissed", async () => {
    const workflow = await createWorkflow(projectRoot, workflowManager);
    const blocker = await feedbackManager.create({
      workflowId: workflow.id,
      stageIndex: 0,
      type: "blocker",
      createdByRole: "impl",
      content: "Waiting on dependency",
    });

    await feedbackManager.dismiss(blocker.id);

    const advanced = await workflowManager.advance(workflow.id);
    expect(advanced.currentStage).toBe(1);
    expect(advanced.blockingFeedbackIds).toEqual([]);
  });

  it("does not block on non-blocker feedback", async () => {
    const workflow = await createWorkflow(projectRoot, workflowManager);
    await feedbackManager.create({
      workflowId: workflow.id,
      stageIndex: 0,
      type: "idea",
      createdByRole: "impl",
      content: "Optional improvement",
    });

    const advanced = await workflowManager.advance(workflow.id);
    expect(advanced.currentStage).toBe(1);
  });
});

async function createWorkflow(
  projectRoot: string,
  manager: WorkflowManager
) {
  const now = new Date();
  const template: WorkflowTemplate = {
    name: "two-stage",
    stages: [
      {
        name: "Stage 1",
        type: "implementation",
        gate: { type: "auto", satisfied: true },
      },
      {
        name: "Stage 2",
        type: "implementation",
        gate: { type: "auto", satisfied: true },
      },
    ],
    builtin: false,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };

  return manager.create({ requestId: "CR-blocker", template });
}
