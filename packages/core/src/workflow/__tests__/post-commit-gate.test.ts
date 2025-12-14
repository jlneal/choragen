/**
 * @design-doc docs/design/core/features/standard-workflow.md
 * @user-intent "Ensure post-commit gate triggers audit chain creation without blocking progression"
 * @test-type unit
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { WorkflowManager, type WorkflowTemplate } from "../manager.js";

const templateMeta = () => ({
  builtin: false,
  version: 1,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
});

describe("post-commit gate", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "post-commit-gate-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  const commitMetadata = {
    sha: "abc123",
    message: "feat: add feature",
    author: "commit-agent",
    filesChanged: ["src/index.ts", "README.md"],
  };

  const baseTemplate: WorkflowTemplate = {
    ...templateMeta(),
    name: "post-commit",
    stages: [
      {
        name: "Commit",
        type: "implementation",
        gate: {
          type: "post_commit",
          commit: commitMetadata,
        },
      },
      {
        name: "Review",
        type: "review",
        gate: { type: "auto" },
      },
    ],
  };

  it("fires audit chain creation asynchronously and advances workflow", async () => {
    const auditCalls: Array<{ commit: typeof commitMetadata }> = [];
    const manager = new WorkflowManager(tempDir, {
      auditChainCreator: async ({ commit }) => {
        auditCalls.push({ commit });
        await new Promise((resolve) => setTimeout(resolve, 5));
        return { chainId: "CHAIN-AUDIT-001" };
      },
    });

    const workflow = await manager.create({ requestId: "CR-POST-1", template: baseTemplate });
    const advanced = await manager.advance(workflow.id);

    expect(advanced.currentStage).toBe(1);
    expect(advanced.stages[0].gate.satisfied).toBe(true);
    expect(auditCalls).toHaveLength(1);
    expect(auditCalls[0]?.commit.sha).toBe("abc123");

    // Allow async audit creation to persist
    await new Promise((resolve) => setTimeout(resolve, 10));
    const reloaded = await manager.get(workflow.id);
    expect(reloaded?.stages[0].gate.auditChainId).toBe("CHAIN-AUDIT-001");
  });

  it("respects auditEnabled flag and skips audit creation when disabled", async () => {
    const auditCalls: Array<unknown> = [];
    const manager = new WorkflowManager(tempDir, {
      auditChainCreator: async (input) => {
        auditCalls.push(input);
      },
    });

    const disabledTemplate: WorkflowTemplate = {
      ...baseTemplate,
      name: "post-commit-disabled",
      stages: [
        {
          ...baseTemplate.stages[0],
          gate: {
            ...(baseTemplate.stages[0].gate as { type: "post_commit" }),
            auditEnabled: false,
          },
        },
        baseTemplate.stages[1],
      ],
    };

    const workflow = await manager.create({ requestId: "CR-POST-2", template: disabledTemplate });
    const advanced = await manager.advance(workflow.id);

    expect(advanced.currentStage).toBe(1);
    expect(advanced.stages[0].gate.satisfied).toBe(true);
    expect(auditCalls).toHaveLength(0);
  });
});
