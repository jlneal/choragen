/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify prompt loader correctly assembles role-specific system prompts with session context"
 * @test-type unit
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PromptLoader, createToolSummaries } from "../runtime/prompt-loader.js";
import type { SessionContext, ToolSummary } from "../runtime/prompt-loader.js";
import * as fs from "node:fs/promises";
import { join } from "node:path";

// Mock fs/promises
vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}));

describe("PromptLoader", () => {
  const mockWorkspaceRoot = "/test/workspace";
  let loader: PromptLoader;

  beforeEach(() => {
    vi.clearAllMocks();
    loader = new PromptLoader(mockWorkspaceRoot);
  });

  describe("load", () => {
    const baseContext: SessionContext = {
      sessionId: "session-20251208-123456",
      workspaceRoot: mockWorkspaceRoot,
      availableTools: [],
    };

    describe("base prompt loading", () => {
      it("loads control agent prompt from docs/agents/control-agent.md", async () => {
        const mockContent = "# Control Agent Role\n\nTest content";
        vi.mocked(fs.readFile).mockResolvedValue(mockContent);

        const result = await loader.load("control", baseContext);

        expect(fs.readFile).toHaveBeenCalledWith(
          join(mockWorkspaceRoot, "docs", "agents", "control-agent.md"),
          "utf-8"
        );
        expect(result).toContain("# Control Agent Role");
        expect(result).toContain("Test content");
      });

      it("loads impl agent prompt from docs/agents/impl-agent.md", async () => {
        const mockContent = "# Implementation Agent Role\n\nImpl content";
        vi.mocked(fs.readFile).mockResolvedValue(mockContent);

        const result = await loader.load("impl", baseContext);

        expect(fs.readFile).toHaveBeenCalledWith(
          join(mockWorkspaceRoot, "docs", "agents", "impl-agent.md"),
          "utf-8"
        );
        expect(result).toContain("# Implementation Agent Role");
        expect(result).toContain("Impl content");
      });

      it("uses fallback prompt when control agent doc is missing", async () => {
        vi.mocked(fs.readFile).mockRejectedValue(new Error("ENOENT"));

        const result = await loader.load("control", baseContext);

        expect(result).toContain("# Control Agent Role");
        expect(result).toContain("managing work but NOT implementing");
      });

      it("uses fallback prompt when impl agent doc is missing", async () => {
        vi.mocked(fs.readFile).mockRejectedValue(new Error("ENOENT"));

        const result = await loader.load("impl", baseContext);

        expect(result).toContain("# Implementation Agent Role");
        expect(result).toContain("executing tasks from task files");
      });
    });

    describe("session section", () => {
      beforeEach(() => {
        vi.mocked(fs.readFile).mockResolvedValue("# Base Prompt");
      });

      it("includes session ID", async () => {
        const result = await loader.load("control", baseContext);

        expect(result).toContain("## Current Session");
        expect(result).toContain("- **Session ID**: session-20251208-123456");
      });

      it("includes role", async () => {
        const result = await loader.load("control", baseContext);

        expect(result).toContain("- **Role**: control");
      });

      it("includes chain ID when provided", async () => {
        const context: SessionContext = {
          ...baseContext,
          chainId: "CHAIN-037-agent-runtime-core",
        };

        const result = await loader.load("control", context);

        expect(result).toContain("- **Chain**: CHAIN-037-agent-runtime-core");
      });

      it("includes task ID when provided", async () => {
        const context: SessionContext = {
          ...baseContext,
          chainId: "CHAIN-037",
          taskId: "005-prompt-loader",
        };

        const result = await loader.load("impl", context);

        expect(result).toContain("- **Task**: 005-prompt-loader");
      });

      it("omits chain when not provided", async () => {
        const result = await loader.load("control", baseContext);

        expect(result).not.toContain("- **Chain**:");
      });

      it("omits task when not provided", async () => {
        const result = await loader.load("control", baseContext);

        expect(result).not.toContain("- **Task**:");
      });
    });

    describe("tools section", () => {
      beforeEach(() => {
        vi.mocked(fs.readFile).mockResolvedValue("# Base Prompt");
      });

      it("includes available tools list", async () => {
        const context: SessionContext = {
          ...baseContext,
          availableTools: [
            { name: "chain:status", description: "View chain status" },
            { name: "task:list", description: "List tasks in chain" },
          ],
        };

        const result = await loader.load("control", context);

        expect(result).toContain("## Available Tools");
        expect(result).toContain("- **chain:status** — View chain status");
        expect(result).toContain("- **task:list** — List tasks in chain");
      });

      it("shows no tools message when list is empty", async () => {
        const result = await loader.load("control", baseContext);

        expect(result).toContain("## Available Tools");
        expect(result).toContain("No tools available for this session.");
      });
    });

    describe("footer section", () => {
      beforeEach(() => {
        vi.mocked(fs.readFile).mockResolvedValue("# Base Prompt");
      });

      it("includes governance notice", async () => {
        const result = await loader.load("control", baseContext);

        expect(result).toContain(
          "You are operating within the Choragen agent runtime."
        );
        expect(result).toContain(
          "All tool calls will be validated against governance rules"
        );
      });
    });

    describe("prompt structure", () => {
      beforeEach(() => {
        vi.mocked(fs.readFile).mockResolvedValue("# Base Prompt Content");
      });

      it("assembles sections in correct order", async () => {
        const context: SessionContext = {
          ...baseContext,
          chainId: "CHAIN-001",
          availableTools: [
            { name: "test:tool", description: "Test tool" },
          ],
        };

        const result = await loader.load("control", context);

        const baseIndex = result.indexOf("# Base Prompt Content");
        const sessionIndex = result.indexOf("## Current Session");
        const toolsIndex = result.indexOf("## Available Tools");
        const footerIndex = result.indexOf("You are operating within");

        expect(baseIndex).toBeLessThan(sessionIndex);
        expect(sessionIndex).toBeLessThan(toolsIndex);
        expect(toolsIndex).toBeLessThan(footerIndex);
      });

      it("includes section separators", async () => {
        const result = await loader.load("control", baseContext);

        // Should have --- separators between major sections
        expect(result).toContain("---");
      });
    });
  });
});

describe("createToolSummaries", () => {
  it("converts tool definitions to summaries", () => {
    const tools = [
      { name: "chain:status", description: "View chain status", extra: "ignored" },
      { name: "task:list", description: "List tasks" },
    ];

    const summaries = createToolSummaries(tools);

    expect(summaries).toHaveLength(2);
    expect(summaries[0]).toEqual({
      name: "chain:status",
      description: "View chain status",
    });
    expect(summaries[1]).toEqual({
      name: "task:list",
      description: "List tasks",
    });
  });

  it("returns empty array for empty input", () => {
    const summaries = createToolSummaries([]);

    expect(summaries).toEqual([]);
  });
});

describe("SessionContext interface", () => {
  it("accepts minimal context", () => {
    const context: SessionContext = {
      sessionId: "test-session",
      workspaceRoot: "/workspace",
      availableTools: [],
    };

    expect(context.sessionId).toBe("test-session");
    expect(context.chainId).toBeUndefined();
    expect(context.taskId).toBeUndefined();
  });

  it("accepts full context", () => {
    const context: SessionContext = {
      sessionId: "test-session",
      chainId: "CHAIN-001",
      taskId: "001-task",
      workspaceRoot: "/workspace",
      availableTools: [
        { name: "tool:one", description: "First tool" },
      ],
    };

    expect(context.chainId).toBe("CHAIN-001");
    expect(context.taskId).toBe("001-task");
    expect(context.availableTools).toHaveLength(1);
  });
});

describe("ToolSummary interface", () => {
  it("contains name and description", () => {
    const summary: ToolSummary = {
      name: "chain:status",
      description: "View chain status",
    };

    expect(summary.name).toBe("chain:status");
    expect(summary.description).toBe("View chain status");
  });
});
