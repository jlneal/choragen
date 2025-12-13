/**
 * @design-doc docs/adr/done/ADR-013-agent-tools-design.md
 * @test-type unit
 * @user-intent "Verify feedback tools create blocking and non-blocking feedback correctly"
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { saveWorkflow, loadWorkflow } from "@choragen/core";
import type { Workflow } from "@choragen/core";
import { executeFeedbackCreate } from "../feedback-tools.js";
import type { ExecutionContext } from "../executor.js";

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

describe("feedback:create tool", () => {
  let tempDir: string;
  let context: ExecutionContext;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-feedback-"));
    await saveWorkflow(tempDir, buildWorkflow());
    context = {
      role: "impl",
      workspaceRoot: tempDir,
    };
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("creates non-blocking feedback and leaves workflow active", async () => {
    const emitEvent = vi.fn();

    const result = await executeFeedbackCreate(
      { workflowId: "wf-001", question: "Need clarification", context: "Details" },
      { ...context, eventEmitter: emitEvent }
    );

    expect(result.success).toBe(true);
    const data = result.data as { feedbackId: string; blocking: boolean; path: string };
    expect(data.blocking).toBe(false);
    expect(data.feedbackId).toMatch(/^FB-/);

    const feedbackPath = path.join(tempDir, data.path);
    const stored = JSON.parse(await fs.readFile(feedbackPath, "utf-8"));
    expect(stored.question).toBe("Need clarification");
    expect(stored.blocking).toBe(false);
    expect(stored.status).toBe("pending");

    expect(emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "feedback.created",
        payload: expect.objectContaining({ feedbackId: stored.id }),
      })
    );

    const workflow = await loadWorkflow(tempDir, "wf-001");
    expect(workflow?.status).toBe("active");
  });

  it("creates blocking feedback and pauses workflow", async () => {
    const emitEvent = vi.fn();

    const result = await executeFeedbackCreate(
      { workflowId: "wf-001", question: "Need human approval", blocking: true },
      { ...context, eventEmitter: emitEvent }
    );

    expect(result.success).toBe(true);
    const data = result.data as { blocking: boolean };
    expect(data.blocking).toBe(true);

    const workflow = await loadWorkflow(tempDir, "wf-001");
    expect(workflow?.status).toBe("paused");

    expect(emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "feedback.created",
        payload: expect.objectContaining({ blocking: true }),
      })
    );
  });
});
