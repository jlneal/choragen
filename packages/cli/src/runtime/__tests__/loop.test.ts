/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Ensure workflow stage initPrompt is injected into initial agent messages"
 * @test-type unit
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { WorkflowManager } from "@choragen/core";
import { runAgentSession, type LLMProvider, type ChatResponse, type Message, type Tool } from "../index.js";

class RecordingProvider implements LLMProvider {
  readonly name = "anthropic" as const;
  readonly model = "mock-model";
  private readonly responses: ChatResponse[];
  private callIndex = 0;
  private readonly _calls: Array<{ messages: Message[]; tools: Tool[] }> = [];

  constructor(responses: ChatResponse[]) {
    this.responses = responses;
  }

  async chat(messages: Message[], tools: Tool[]): Promise<ChatResponse> {
    const capturedMessages = messages.map((msg) => ({ ...msg }));
    const capturedTools = [...tools];
    this._calls.push({ messages: capturedMessages, tools: capturedTools });
    const response = this.responses[this.callIndex];
    if (!response) {
      throw new Error("No mock response available");
    }
    this.callIndex += 1;
    return response;
  }

  get calls(): Array<{ messages: Message[]; tools: Tool[] }> {
    return this._calls;
  }
}

const templateMeta = () => ({
  builtin: false,
  version: 1,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
});

describe("runAgentSession initPrompt injection", () => {
  let tempDir: string;
  let manager: WorkflowManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-loop-"));
    manager = new WorkflowManager(tempDir);
    await fs.mkdir(path.join(tempDir, ".choragen"), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("injects stage initPrompt after system prompt", async () => {
    const chainId = "CHAIN-42";
    const initPrompt =
      "Request: {{requestId}} | WF: {{workflowId}} | Chain: {{chainId}} | Stage: {{stageName}} ({{stageType}}) | Unknown: {{unknownVar}}";
    const workflow = await manager.create({
      requestId: "CR-1",
      template: {
        ...templateMeta(),
        name: "with-initprompt",
        stages: [
          { name: "Request", type: "request", initPrompt, gate: { type: "auto" } },
        ],
      },
    });

    const provider = new RecordingProvider([
      {
        content: "Acknowledged.",
        toolCalls: [],
        stopReason: "end_turn",
        usage: { inputTokens: 5, outputTokens: 5 },
      },
    ]);

    const result = await runAgentSession({
      role: "impl",
      provider,
      workspaceRoot: tempDir,
      workflowId: workflow.id,
      chainId,
    });

    expect(result.success).toBe(true);
    const [firstCall] = provider.calls;
    expect(firstCall).toBeDefined();
    expect(firstCall.messages[0].role).toBe("system");
    expect(firstCall.messages[1]).toMatchObject({
      role: "user",
    });
    const stageMessage = firstCall.messages[1].content;
    expect(stageMessage).toContain("Stage Instructions");
    expect(stageMessage).toContain("Request: CR-1");
    expect(stageMessage).toContain(`WF: ${workflow.id}`);
    expect(stageMessage).toContain(`Chain: ${chainId}`);
    expect(stageMessage).toContain("Stage: Request (request)");
    expect(stageMessage).toContain("Unknown: {{unknownVar}}");
    expect(firstCall.messages[2].role).toBe("user");
    expect(firstCall.messages[2].content).toContain("implementation agent ready");
  });

  it("does not inject initPrompt when absent", async () => {
    const workflow = await manager.create({
      requestId: "CR-2",
      template: {
        ...templateMeta(),
        name: "without-initprompt",
        stages: [{ name: "Request", type: "request", gate: { type: "auto" } }],
      },
    });

    const provider = new RecordingProvider([
      {
        content: "Proceeding.",
        toolCalls: [],
        stopReason: "end_turn",
        usage: { inputTokens: 5, outputTokens: 5 },
      },
    ]);

    const result = await runAgentSession({
      role: "impl",
      provider,
      workspaceRoot: tempDir,
      workflowId: workflow.id,
    });

    expect(result.success).toBe(true);
    const [firstCall] = provider.calls;
    expect(firstCall.messages).toHaveLength(2);
    expect(firstCall.messages[0].role).toBe("system");
    expect(firstCall.messages[1].role).toBe("user");
    expect(firstCall.messages[1].content).not.toContain("Stage Instructions");
  });
});
