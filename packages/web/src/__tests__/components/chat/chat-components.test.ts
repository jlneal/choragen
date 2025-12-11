/**
 * @design-doc docs/design/core/features/web-chat-interface.md
 * @user-intent "Verify chat component helper logic for sorting, formatting, scrolling, and send payloads"
 * @test-type unit
 */

import { describe, expect, it } from "vitest";

import { sortMessagesByTimestamp } from "@/components/chat/chat-container";
import { scrollToBottom } from "@/components/chat/message-list";
import { formatMessageTimestamp } from "@/components/chat/message-item";
import { buildSendPayload } from "@/components/chat/chat-input";
import type { WorkflowMessage } from "@choragen/core";

describe("ChatContainer helpers", () => {
  it("sorts messages by timestamp ascending", () => {
    const messages: WorkflowMessage[] = [
      {
        id: "2",
        role: "impl",
        content: "Later",
        stageIndex: 0,
        timestamp: new Date("2025-01-02T00:00:00Z"),
      },
      {
        id: "1",
        role: "human",
        content: "First",
        stageIndex: 0,
        timestamp: new Date("2025-01-01T00:00:00Z"),
      },
    ];

    const sorted = sortMessagesByTimestamp(messages);

    expect(sorted[0].id).toBe("1");
    expect(sorted[1].id).toBe("2");
  });
});

describe("MessageList helpers", () => {
  it("scrolls to bottom of container", () => {
    const container = {
      scrollHeight: 400,
      clientHeight: 250,
      scrollTop: 0,
    };

    scrollToBottom(container);

    const EXPECTED_SCROLL_TOP = 150;
    expect(container.scrollTop).toBe(EXPECTED_SCROLL_TOP);
  });
});

describe("MessageItem helpers", () => {
  it("formats timestamp for display", () => {
    const timestamp = new Date("2025-01-01T12:34:00Z");
    const formatted = formatMessageTimestamp(timestamp);

    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
  });

  it("falls back for invalid timestamp", () => {
    const formatted = formatMessageTimestamp("invalid-date");

    expect(formatted).toBe("Unknown time");
  });
});

describe("ChatInput helpers", () => {
  it("builds payload with trimmed content and defaults", () => {
    const payload = buildSendPayload({
      workflowId: "WF-123",
      content: "  hello world  ",
    });

    expect(payload).toMatchObject({
      workflowId: "WF-123",
      role: "human",
      content: "hello world",
      stageIndex: 0,
    });
  });

  it("clamps negative stage index", () => {
    const payload = buildSendPayload({
      workflowId: "WF-123",
      content: "message",
      stageIndex: -1,
      role: "control",
    });

    expect(payload.stageIndex).toBe(0);
    expect(payload.role).toBe("control");
  });
});
