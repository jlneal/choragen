/**
 * @design-doc docs/design/core/features/workflow-orchestration.md
 * @user-intent "Ensure agent sessions honor workflow stage tool filtering and record messages to workflow history"
 * @test-type integration
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { WorkflowManager } from "@choragen/core";
import { runAgentSession, type LLMProvider, type ChatResponse, type Message, type Tool } from "../index.js";

const templateMeta = () => ({
  builtin: false,
  version: 1,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
});

class MockLLMProvider implements LLMProvider {
  readonly name = "anthropic" as const;
  readonly model = "mock-model";
  private readonly responses: ChatResponse[];
  private callIndex = 0;
  private readonly _calls: Array<{ messages: Message[]; tools: Tool[] }> = [];

  constructor(responses: ChatResponse[]) {
    this.responses = responses;
  }

  async chat(messages: Message[], tools: Tool[]): Promise<ChatResponse> {
    this._calls.push({ messages, tools });
    if (this.callIndex >= this.responses.length) {
      throw new Error("No more mock responses available");
    }
    return this.responses[this.callIndex++];
  }

  get calls(): Array<{ messages: Message[]; tools: Tool[] }> {
    return this._calls;
  }
}

describe("workflow-aware agent sessions", () => {
  let tempDir: string;
  let manager: WorkflowManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-workflow-session-"));
    manager = new WorkflowManager(tempDir);
    await fs.mkdir(path.join(tempDir, ".choragen"), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("filters tools by workflow stage and records messages", async () => {
    const workflow = await manager.create({
      requestId: "CR-1",
      template: {
        ...templateMeta(),
        name: "stage-test",
        stages: [
          { name: "Request", type: "request", gate: { type: "auto" } },
          { name: "Impl", type: "implementation", gate: { type: "auto" } },
        ],
      },
    });

    const provider = new MockLLMProvider([
      {
        content: "Acknowledged request stage.",
        toolCalls: [],
        stopReason: "end_turn",
        usage: { inputTokens: 10, outputTokens: 5 },
      },
    ]);

    const result = await runAgentSession(
      {
        role: "impl",
        provider,
        workspaceRoot: tempDir,
        workflowId: workflow.id,
      },
      {
        // no custom deps
      }
    );

    expect(result.success).toBe(true);
    // Request stage should filter out impl-only tools like write_file
    const toolsUsed = provider.calls[0].tools.map((t) => t.name);
    expect(toolsUsed).toContain("read_file");
    expect(toolsUsed).not.toContain("write_file");

    const updated = await manager.get(workflow.id);
    expect(updated?.messages.length).toBe(1);
    expect(updated?.messages[0].content).toContain("Acknowledged request stage.");
  });
});
