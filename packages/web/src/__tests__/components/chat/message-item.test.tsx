/**
 * @design-doc docs/design/core/features/web-chat-interface.md
 * @user-intent "Verify message item renders role-specific styles and badges"
 * @test-type unit
 */

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { MessageItem } from "@/components/chat/message-item";
import type { WorkflowMessage } from "@choragen/core";

function createMessage(overrides: Partial<WorkflowMessage>): WorkflowMessage {
  return {
    id: "msg-1",
    role: "human",
    content: "Hello",
    stageIndex: 0,
    timestamp: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("MessageItem", () => {
  it("renders human message right-aligned with user bubble", () => {
    const html = renderToStaticMarkup(
      <MessageItem message={createMessage({ role: "human" })} />
    );

    expect(html).toContain("justify-end");
    expect(html).toContain("You");
    expect(html).toContain("bg-primary");
  });

  it("renders control message with badge and left alignment", () => {
    const html = renderToStaticMarkup(
      <MessageItem message={createMessage({ role: "control", id: "msg-control" })} />
    );

    expect(html).toContain("justify-start");
    expect(html).toContain("Control");
    expect(html).toContain("bg-blue-100");
  });

  it("renders impl message nested with badge", () => {
    const html = renderToStaticMarkup(
      <MessageItem message={createMessage({ role: "impl", id: "msg-impl" })} />
    );

    expect(html).toContain("pl-6");
    expect(html).toContain("Impl");
    expect(html).toContain("border-purple");
  });

  it("renders system message centered with muted style", () => {
    const html = renderToStaticMarkup(
      <MessageItem message={createMessage({ role: "system", id: "msg-system" })} />
    );

    expect(html).toContain("justify-center");
    expect(html).toContain("System");
    expect(html).toContain("text-center");
  });

  it("renders error message with destructive banner", () => {
    const html = renderToStaticMarkup(
      <MessageItem
        message={createMessage({
          role: "system",
          id: "msg-error",
          metadata: { type: "error" },
          content: "Something went wrong",
        })}
      />
    );

    expect(html).toContain("destructive");
    expect(html).toContain("Error");
    expect(html).toContain("Something went wrong");
  });
});
