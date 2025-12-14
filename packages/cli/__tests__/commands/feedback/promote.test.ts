/**
 * @design-doc docs/design/core/features/agent-feedback.md
 * @user-intent "Promote feedback into change requests and mark feedback resolved"
 * @test-type unit
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { FeedbackManager } from "@choragen/core";

import {
  createFeedbackPromoteContext,
  promoteFeedbackCommand,
} from "../../../src/commands/feedback/promote.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_SOURCE = path.resolve(__dirname, "../../../../../templates/change-request.md");

describe("feedback:promote command", () => {
  let projectRoot: string;
  let manager: FeedbackManager;

  beforeEach(async () => {
    projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-feedback-promote-"));
    manager = new FeedbackManager(projectRoot);
  });

  afterEach(async () => {
    await fs.rm(projectRoot, { recursive: true, force: true });
  });

  async function copyTemplate(): Promise<void> {
    const destDir = path.join(projectRoot, "templates");
    await fs.mkdir(destDir, { recursive: true });
    await fs.copyFile(TEMPLATE_SOURCE, path.join(destDir, "change-request.md"));
  }

  it("creates a change request and updates feedback with promotion metadata", async () => {
    await copyTemplate();
    const feedback = await manager.create({
      workflowId: "WF-100",
      stageIndex: 0,
      type: "idea",
      createdByRole: "impl",
      content: "Add lint rule to flag unused imports for CI stability.",
      category: "lint",
      source: "reflection",
    });

    const result = await promoteFeedbackCommand(
      createFeedbackPromoteContext(projectRoot),
      { feedbackId: feedback.id, workflowId: "WF-100" }
    );

    expect(result.success).toBe(true);
    expect(result.crId).toMatch(/^CR-\d{8}-\d{3}/);
    expect(result.crPath).toContain("docs/requests/change-requests/todo");

    const crContent = await fs.readFile(path.join(projectRoot, result.crPath!), "utf-8");
    expect(crContent).toContain(feedback.content);
    expect(crContent).toContain("Promoted from idea feedback");
    expect(crContent).toContain("Category: lint");

    const updated = await manager.get(feedback.id, "WF-100");
    expect(updated?.status).toBe("resolved");
    expect(updated?.promotedTo).toBe(result.crId);
    expect(updated?.response?.content).toContain(result.crId!);
  });

  it("returns an error when feedback is missing", async () => {
    await copyTemplate();
    const result = await promoteFeedbackCommand(
      createFeedbackPromoteContext(projectRoot),
      { feedbackId: "FB-404", workflowId: "WF-404" }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Feedback not found");
  });

  it("prevents promoting resolved feedback", async () => {
    await copyTemplate();
    const feedback = await manager.create({
      workflowId: "WF-200",
      stageIndex: 1,
      type: "review",
      createdByRole: "control",
      content: "Manual review completed.",
    });
    await manager.respond(
      feedback.id,
      { content: "already resolved", respondedBy: "lead" },
      "WF-200"
    );

    const result = await promoteFeedbackCommand(
      createFeedbackPromoteContext(projectRoot),
      { feedbackId: feedback.id, workflowId: "WF-200" }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("already resolved");
  });
});
