/**
 * @design-doc docs/design/core/features/web-chat-interface.md
 * @user-intent "Verify workflow message helpers for sorting and deduplication"
 * @test-type unit
 */

import { describe, expect, it } from "vitest";

import { dedupeMessages, sortMessages } from "@/hooks/use-workflow-messages";

describe("useWorkflowMessages helpers", () => {
  it("sorts messages by timestamp ascending", () => {
    const messages = [
      {
        id: "b",
        role: "human" as const,
        content: "Later",
        stageIndex: 0,
        timestamp: new Date("2025-01-02T00:00:00Z"),
      },
      {
        id: "a",
        role: "human" as const,
        content: "Earlier",
        stageIndex: 0,
        timestamp: new Date("2025-01-01T00:00:00Z"),
      },
    ];

    const sorted = sortMessages(messages);

    expect(sorted[0].id).toBe("a");
    expect(sorted[1].id).toBe("b");
  });

  it("dedupes messages with same id", () => {
    const existing = [
      {
        id: "a",
        role: "human" as const,
        content: "Original",
        stageIndex: 0,
        timestamp: new Date("2025-01-01T00:00:00Z"),
      },
    ];
    const next = {
      id: "a",
      role: "human" as const,
      content: "Duplicate",
      stageIndex: 0,
      timestamp: new Date("2025-01-02T00:00:00Z"),
    };

    const result = dedupeMessages(existing, next);

    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("Original");
  });
});
