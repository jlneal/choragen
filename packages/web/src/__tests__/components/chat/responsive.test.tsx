/**
 * @design-doc docs/design/core/features/web-chat-interface.md
 * @user-intent "Ensure chat layout and sidebar are mobile responsive with sticky input and sheet sidebar"
 * @test-type unit
 */

import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { ChatContainer } from "@/components/chat/chat-container";
import { WorkflowSidebar } from "@/components/chat/workflow-sidebar";
import { ChatInput } from "@/components/chat/chat-input";

const useWorkflowMessagesMock = vi.fn();
const mutateMock = vi.fn();
const invalidateMock = vi.fn();
const providerStatusMock = {
  providers: { anthropic: true, openai: true, google: false, ollama: false },
  isConfigured: true,
  isLoading: false,
  isError: false,
  error: null,
  refresh: vi.fn(),
};

vi.mock("@/hooks/use-workflow-messages", () => ({
  useWorkflowMessages: (workflowId: string, initial?: unknown[]) =>
    useWorkflowMessagesMock(workflowId, initial),
  sortMessagesByTimestamp: (messages: unknown[]) => messages,
}));

vi.mock("@/hooks/use-provider-status", () => ({
  useProviderStatus: () => providerStatusMock,
}));

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    useUtils: () => ({
      workflow: {
        get: { invalidate: invalidateMock },
        list: { invalidate: invalidateMock },
        getHistory: { invalidate: invalidateMock },
      },
    }),
    workflow: {
      get: {
        useQuery: () => ({ data: undefined }),
      },
      sendMessage: {
        useMutation: (options?: { onSuccess?: () => void }) => {
          return {
            mutate: mutateMock,
            isPending: false,
          };
        },
      },
      cancel: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
      pause: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
      resume: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
      discard: {
        useMutation: () => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isPending: false,
        }),
      },
      currentModel: {
        useQuery: () => ({
          data: undefined,
          isLoading: false,
        }),
      },
    },
    providers: {
      listModels: {
        useQuery: () => ({
          data: { providers: { anthropic: { configured: true, models: [] }, openai: { configured: false, models: [] } } },
          isLoading: false,
        }),
      },
    },
  },
}));

vi.mock("@/lib/agent-stream", () => ({
  subscribeToAgentStream: () => () => {},
}));

describe("Responsive chat layout", () => {
  it("keeps input docked to bottom on mobile", () => {
    useWorkflowMessagesMock.mockReturnValue({
      messages: [
        {
          id: "m1",
          role: "human",
          content: "Hi",
          stageIndex: 0,
          timestamp: new Date("2025-01-01T00:00:00Z"),
        },
      ],
      isLoading: false,
      error: null,
      reconnect: vi.fn(),
    });

    const html = renderToStaticMarkup(
      <ChatContainer workflowId="wf-mobile" />
    );

    expect(html).toContain("sticky bottom-0");
    expect(html).toContain("pb-24");
    expect(html).toContain("overflow-x-hidden");
  });

  it("expands message bubbles to full width on small screens", () => {
    useWorkflowMessagesMock.mockReturnValue({
      messages: [
        {
          id: "m1",
          role: "control",
          content: "Control reply",
          stageIndex: 0,
          timestamp: new Date("2025-01-01T00:00:05Z"),
        },
      ],
      isLoading: false,
      error: null,
      reconnect: vi.fn(),
    });

    const html = renderToStaticMarkup(
      <ChatContainer workflowId="wf-mobile-width" />
    );

    expect(html).toContain("max-w-full sm:max-w-[720px]");
  });

  it("renders sheet-based sidebar trigger with touch-friendly sizing", () => {
    const html = renderToStaticMarkup(
      <WorkflowSidebar
        workflowId="WF-123"
        requestId="CR-1"
        status="active"
        template="standard"
        stageSummary="Stage 1 of 3"
        updatedAt={new Date("2025-01-01T00:00:00Z")}
        stages={[]}
        messages={[]}
        createdAt={new Date("2025-01-01T00:00:00Z")}
        defaultOpen
      />
    );

    expect(html).toContain("min-h-[44px]");
    expect(html).toContain('aria-expanded="true"');
  });

  it("ensures chat input controls meet minimum touch target sizes", () => {
    const html = renderToStaticMarkup(
      <ChatInput workflowId="WF-touch" />
    );

    expect(html).toContain("min-h-[44px]");
    expect(html).toContain("min-w-[44px]");
  });
});
