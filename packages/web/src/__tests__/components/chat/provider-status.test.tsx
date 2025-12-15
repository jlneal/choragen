/**
 * @design-doc docs/design/core/features/web-chat-interface.md
 * @user-intent "Ensure chat UI blocks interactions when no provider is configured and guides users to settings"
 * @test-type unit
 */

import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { ChatInput } from "@/components/chat/chat-input";
import { NewWorkflowView } from "@/components/chat/new-workflow-view";

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    workflow: {
      sendMessage: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
      create: {
        useMutation: () => ({
          mutate: vi.fn(),
          isPending: false,
        }),
      },
      list: {
        useQuery: () => ({ data: [], isLoading: false, error: null, refetch: vi.fn(), isRefetching: false }),
      },
      currentModel: {
        useQuery: () => ({
          data: undefined,
          isLoading: false,
        }),
      },
    },
    backlog: {
      list: {
        useQuery: () => ({
          data: [],
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isRefetching: false,
        }),
      },
    },
    providers: {
      listModels: {
        useQuery: () => ({
          data: { providers: { anthropic: { configured: false, models: [] }, openai: { configured: false, models: [] } } },
          isLoading: false,
        }),
      },
    },
  },
}));

vi.mock("@/hooks/use-provider-status", () => ({
  useProviderStatus: () => ({
    providers: { anthropic: false, openai: false, google: false, ollama: false },
    isConfigured: false,
    isLoading: false,
    isError: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("Provider status guardrails", () => {
  it("shows banner and disables chat input when no provider configured", () => {
    const html = renderToStaticMarkup(<ChatInput workflowId="WF-001" />);

    expect(html).toContain("Provider required");
    expect(html).toContain("/settings");
    expect(html).toContain("disabled");
  });

  it("blocks workflow creation without provider and links to settings", () => {
    const html = renderToStaticMarkup(<NewWorkflowView />);

    expect(html).toContain("Provider required");
    expect(html).toContain("/settings");
    expect(html).toContain("Start ideation");
  });
});
