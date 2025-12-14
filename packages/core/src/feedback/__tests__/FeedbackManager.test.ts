/**
 * @design-doc docs/design/core/features/agent-feedback.md
 * @user-intent "Validate feedback lifecycle operations and persistence"
 * @test-type unit
 */

import { beforeEach, describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { FeedbackManager } from "../FeedbackManager.js";
import { FEEDBACK_TYPE_BEHAVIOR } from "../types.js";

describe("FeedbackManager", () => {
  let tempDir: string;
  let manager: FeedbackManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "feedback-manager-"));
    manager = new FeedbackManager(tempDir);
  });

  it("creates feedback with generated id, default priority, and persists to disk", async () => {
    const feedback = await manager.create({
      workflowId: "WF-001",
      stageIndex: 0,
      type: "blocker",
      createdByRole: "impl",
      content: "Build is failing on CI",
    });

    expect(feedback.id).toMatch(/^FB-/);
    expect(feedback.status).toBe("pending");
    expect(feedback.priority).toBe("critical");
    expect(feedback.createdAt).toBeInstanceOf(Date);

    const storedPath = path.join(
      tempDir,
      ".choragen/workflows/WF-001/feedback",
      `${feedback.id}.json`
    );
    const stored = await fs.readFile(storedPath, "utf-8");
    expect(stored).toContain(feedback.id);
  });

  it("applies audit defaults and metadata for system-generated findings", async () => {
    const feedback = await manager.create({
      workflowId: "WF-010",
      stageIndex: 2,
      type: "audit",
      createdByRole: "control",
      content: "Audit findings for commit abc123.",
    });

    expect(feedback.priority).toBe("low");
    expect(FEEDBACK_TYPE_BEHAVIOR.audit.blocksWork).toBe(false);
  });

  it("retrieves feedback by id after reload", async () => {
    const created = await manager.create({
      workflowId: "WF-002",
      stageIndex: 1,
      type: "question",
      priority: "high",
      createdByRole: "impl",
      content: "Should we use cache for this call?",
    });

    const reloaded = new FeedbackManager(tempDir);
    const fetched = await reloaded.get(created.id);
    expect(fetched?.content).toBe("Should we use cache for this call?");
    expect(fetched?.priority).toBe("high");
    expect(fetched?.workflowId).toBe("WF-002");
  });

  it("lists feedback with filters", async () => {
    const pending = await manager.create({
      workflowId: "WF-003",
      stageIndex: 0,
      type: "question",
      createdByRole: "impl",
      content: "What is the target branch?",
    });

    const acknowledged = await manager.create({
      workflowId: "WF-003",
      stageIndex: 1,
      type: "clarification",
      createdByRole: "impl",
      content: "Which API version should we call?",
    });
    await manager.acknowledge(acknowledged.id, "WF-003");

    const dismissed = await manager.create({
      workflowId: "WF-004",
      stageIndex: 2,
      type: "idea",
      createdByRole: "impl",
      content: "We could add telemetry here.",
    });
    await manager.dismiss(dismissed.id, "WF-004");

    const pendingOnly = await manager.list({ status: "pending" });
    expect(pendingOnly.map((f) => f.id)).toContain(pending.id);
    expect(pendingOnly.find((f) => f.id === acknowledged.id)).toBeUndefined();

    const clarifications = await manager.list({ type: "clarification" });
    expect(clarifications).toHaveLength(1);
    expect(clarifications[0].id).toBe(acknowledged.id);

    const workflowFiltered = await manager.list({ workflowId: "WF-004" });
    expect(workflowFiltered).toHaveLength(1);
    expect(workflowFiltered[0].id).toBe(dismissed.id);
  });

  it("acknowledges pending feedback and prevents double acknowledgement", async () => {
    const created = await manager.create({
      workflowId: "WF-005",
      stageIndex: 0,
      type: "clarification",
      createdByRole: "impl",
      content: "Need acceptance criteria confirmation.",
    });

    const acknowledged = await manager.acknowledge(created.id, "WF-005");
    expect(acknowledged.status).toBe("acknowledged");
    expect(acknowledged.updatedAt.getTime()).toBeGreaterThan(
      acknowledged.createdAt.getTime()
    );

    await expect(manager.acknowledge(created.id, "WF-005")).rejects.toThrow(
      "Only pending feedback can be acknowledged"
    );
  });

  it("responds to feedback and sets resolved fields", async () => {
    const created = await manager.create({
      workflowId: "WF-006",
      stageIndex: 0,
      type: "review",
      createdByRole: "impl",
      content: "Please review the refactor plan.",
    });

    const responseTime = new Date();
    const responded = await manager.respond(
      created.id,
      {
        content: "Proceed with plan A.",
        selectedOption: "plan-a",
        respondedBy: "tech-lead",
        respondedAt: responseTime,
      },
      "WF-006"
    );

    expect(responded.status).toBe("resolved");
    expect(responded.response?.content).toBe("Proceed with plan A.");
    expect(responded.response?.selectedOption).toBe("plan-a");
    expect(responded.resolvedAt?.toISOString()).toBe(responseTime.toISOString());

    const reloaded = await manager.get(created.id, "WF-006");
    expect(reloaded?.status).toBe("resolved");
    expect(reloaded?.response?.respondedBy).toBe("tech-lead");
  });

  it("prevents responding to dismissed or resolved feedback", async () => {
    const dismissed = await manager.create({
      workflowId: "WF-007",
      stageIndex: 0,
      type: "idea",
      createdByRole: "impl",
      content: "Optional optimization.",
    });
    await manager.dismiss(dismissed.id, "WF-007");

    await expect(
      manager.respond(
        dismissed.id,
        { content: "Too late", respondedBy: "lead" },
        "WF-007"
      )
    ).rejects.toThrow("Cannot respond to dismissed feedback");

    const resolved = await manager.create({
      workflowId: "WF-008",
      stageIndex: 0,
      type: "question",
      createdByRole: "impl",
      content: "Should we add retries?",
    });
    await manager.respond(
      resolved.id,
      { content: "No retries needed", respondedBy: "lead" },
      "WF-008"
    );

    await expect(
      manager.respond(
        resolved.id,
        { content: "Another response", respondedBy: "lead" },
        "WF-008"
      )
    ).rejects.toThrow("Feedback is already resolved");
  });

  it("dismisses pending feedback and blocks dismissing resolved items", async () => {
    const created = await manager.create({
      workflowId: "WF-009",
      stageIndex: 0,
      type: "question",
      createdByRole: "impl",
      content: "Is staging ready?",
    });

    const dismissed = await manager.dismiss(created.id, "WF-009");
    expect(dismissed.status).toBe("dismissed");
    expect(dismissed.updatedAt.getTime()).toBeGreaterThan(
      dismissed.createdAt.getTime()
    );

    const resolved = await manager.create({
      workflowId: "WF-009",
      stageIndex: 1,
      type: "clarification",
      createdByRole: "impl",
      content: "Need final confirmation.",
    });
    await manager.respond(
      resolved.id,
      { content: "Confirmed", respondedBy: "pm" },
      "WF-009"
    );

    await expect(manager.dismiss(resolved.id, "WF-009")).rejects.toThrow(
      "Cannot dismiss resolved feedback"
    );
  });
});
