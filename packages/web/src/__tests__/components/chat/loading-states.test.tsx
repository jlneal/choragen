/**
 * @design-doc docs/design/core/features/web-chat-interface.md
 * @user-intent "Validate chat loading skeletons and typing indicator behavior"
 * @test-type unit
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { ChatContainer } from "@/components/chat/chat-container";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { MessageSkeleton } from "@/components/chat/message-skeleton";
import { WorkflowCardSkeleton } from "@/components/chat/workflow-card-skeleton";
import type { WorkflowMessage } from "@choragen/core";

const useWorkflowMessagesMock = vi.fn();
const invokeAgentMock = vi.fn();

vi.mock("@/hooks/use-workflow-messages", () => ({
  useWorkflowMessages: (workflowId: string, initial?: WorkflowMessage[]) =>
    useWorkflowMessagesMock(workflowId, initial),
  sortMessagesByTimestamp: (messages: WorkflowMessage[]) => messages,
}));

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    useUtils: () => ({
      workflow: {
        get: { invalidate: vi.fn() },
        list: { invalidate: vi.fn() },
      },
    }),
    workflow: {
      invokeAgent: {
        useMutation: () => ({
          mutate: invokeAgentMock,
          mutateAsync: invokeAgentMock,
          isPending: false,
        }),
      },
    },
  },
}));

vi.mock("@/lib/agent-stream", () => ({
  subscribeToAgentStream: () => () => {},
}));

vi.mock("@/components/chat/chat-input", () => ({
  ChatInput: (props: { onSent?: () => void }) => {
    props.onSent?.();
    return <div data-testid="chat-input" />;
  },
}));

describe("Loading states", () => {
  beforeEach(() => {
    useWorkflowMessagesMock.mockReset();
  });

  it("renders animated dots for typing indicator", () => {
    const html = renderToStaticMarkup(<TypingIndicator />);

    expect(html).toContain("Assistant");
    expect(html).toContain("animate-bounce");
  });

  it("shows message skeleton aligned to sender side", () => {
    const leftHtml = renderToStaticMarkup(<MessageSkeleton alignment="left" />);
    const rightHtml = renderToStaticMarkup(<MessageSkeleton alignment="right" />);

    expect(leftHtml).toContain("justify-start");
    expect(leftHtml).toContain("animate-pulse");
    expect(rightHtml).toContain("justify-end");
  });

  it("renders workflow card skeleton grid", () => {
    const html = renderToStaticMarkup(<WorkflowCardSkeleton count={2} />);

    expect(html).toContain("md:grid-cols-2");
    const headerOccurrences = html.split("h-4 w-1/3").length - 1;
    expect(headerOccurrences).toBe(2);
  });

  it("shows typing indicator when last message is human", () => {
    useWorkflowMessagesMock.mockReturnValue({
      messages: [
        {
          id: "m1",
          role: "human",
          content: "Hello?",
          stageIndex: 0,
          timestamp: new Date("2025-01-01T00:00:00Z"),
        },
      ],
      isLoading: false,
      error: null,
      reconnect: vi.fn(),
    });

    const html = renderToStaticMarkup(
      <ChatContainer workflowId="wf-1" initialMessages={[]} />
    );

    expect(html).toContain("Implementation agent");
    expect(html).toContain("animate-bounce");
  });

  it("hides typing indicator when agent responds", () => {
    useWorkflowMessagesMock.mockReturnValue({
      messages: [
        {
          id: "m1",
          role: "human",
          content: "Hello?",
          stageIndex: 0,
          timestamp: new Date("2025-01-01T00:00:00Z"),
        },
        {
          id: "m2",
          role: "impl",
          content: "Hi there",
          stageIndex: 0,
          timestamp: new Date("2025-01-01T00:00:05Z"),
        },
      ],
      isLoading: false,
      error: null,
      reconnect: vi.fn(),
    });

    const html = renderToStaticMarkup(
      <ChatContainer workflowId="wf-2" initialMessages={[]} />
    );

    expect(html).not.toContain("animate-bounce");
  });

  it("shows message skeletons while loading", () => {
    useWorkflowMessagesMock.mockReturnValue({
      messages: [],
      isLoading: true,
      error: null,
      reconnect: vi.fn(),
    });

    const html = renderToStaticMarkup(
      <ChatContainer workflowId="wf-3" initialMessages={[]} />
    );

    expect(html).toContain("animate-pulse");
  });
});
