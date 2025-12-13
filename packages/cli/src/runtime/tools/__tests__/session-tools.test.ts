/**
 * @design-doc docs/adr/done/ADR-013-agent-tools-design.md
 * @test-type unit
 * @user-intent "Verify spawn_agent tool spawns nested sessions with role validation"
 */

import { describe, it, expect, vi } from "vitest";
import { executeSpawnAgent } from "../session-tools.js";
import type { ExecutionContext, NestedSessionContext } from "../executor.js";

function buildNestedContext(overrides: Partial<NestedSessionContext> = {}): NestedSessionContext {
  return {
    role: "control",
    workspaceRoot: "/tmp",
    sessionId: "parent-session",
    nestingDepth: 0,
    maxNestingDepth: 2,
    chainId: "CHAIN-001",
    taskId: "001-task",
    spawnChildSession: vi.fn(async () => ({
      success: true,
      sessionId: "child-session",
      iterations: 1,
      tokensUsed: { input: 10, output: 5 },
      summary: "Completed",
    })),
    ...overrides,
  };
}

describe("spawn_agent tool", () => {
  it("fails when role is missing", async () => {
    const context: ExecutionContext = { role: "control", workspaceRoot: "/tmp" };
    const result = await executeSpawnAgent({}, context);
    expect(result.success).toBe(false);
    expect(result.error).toContain("role");
  });

  it("blocks privilege escalation from non-control roles", async () => {
    const context = buildNestedContext({ role: "impl" });
    const result = await executeSpawnAgent({ role: "control" }, context);
    expect(result.success).toBe(false);
    expect(result.error).toContain("cannot spawn");
  });

  it("spawns a child session with requested role", async () => {
    const spawnChildSession = vi.fn(async () => ({
      success: true,
      sessionId: "child-session",
      iterations: 2,
      tokensUsed: { input: 20, output: 10 },
      summary: "Done",
    }));

    const context = buildNestedContext({ spawnChildSession });

    const result = await executeSpawnAgent(
      { role: "design", chainId: "CHAIN-002", taskId: "002-task", context: "Do design review" },
      context
    );

    expect(result.success).toBe(true);
    expect(spawnChildSession).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "design",
        roleId: "design",
        chainId: "CHAIN-002",
        taskId: "002-task",
        context: "Do design review",
      })
    );
    expect(result.data).toMatchObject({
      childSessionId: "child-session",
      role: "design",
    });
  });

  it("rejects when nesting depth exceeded", async () => {
    const context = buildNestedContext({ nestingDepth: 2, maxNestingDepth: 2 });
    const result = await executeSpawnAgent({ role: "impl" }, context);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Maximum nesting depth");
  });
});
