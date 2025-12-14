/**
 * @design-doc docs/design/core/features/workflow-orchestration.md
 * @user-intent "Ensure reflection stages create non-blocking feedback suggestions"
 * @test-type unit
 */

import { beforeEach, afterEach, describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { WorkflowManager, type WorkflowTemplate } from "../manager.js";
import { FeedbackManager } from "../../feedback/FeedbackManager.js";

const templateMeta = () => ({
  builtin: false,
  version: 1,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
});

const reflectionTemplate: WorkflowTemplate = {
  ...templateMeta(),
  name: "reflection",
  stages: [
    {
      name: "request",
      type: "request",
      gate: { type: "auto" },
    },
    {
      name: "reflection",
      type: "reflection",
      initPrompt: "Reflect on the fix and create improvement feedback.",
      gate: { type: "auto" },
    },
  ],
};

describe("reflection stage", () => {
  let tempDir: string;
  let manager: WorkflowManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "workflow-reflection-"));
    manager = new WorkflowManager(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("creates reflection feedback on stage entry and does not block completion", async () => {
    const workflow = await manager.create({ requestId: "CR-REFLECT-001", template: reflectionTemplate });
    const afterRequest = await manager.advance(workflow.id);

    const feedbackManager = new FeedbackManager(tempDir);
    const feedback = await feedbackManager.list({
      workflowId: afterRequest.id,
      source: "reflection",
    });

    expect(feedback).toHaveLength(1);
    const reflectionItem = feedback[0];
    expect(reflectionItem.type).toBe("idea");
    expect(reflectionItem.source).toBe("reflection");
    expect(reflectionItem.category).toBe("workflow");
    expect(reflectionItem.content).toContain("Root cause");
    expect(reflectionItem.stageIndex).toBe(1);

    const completed = await manager.advance(afterRequest.id);
    expect(completed.status).toBe("completed");
    expect(completed.stages[1].status).toBe("completed");
  });
});
