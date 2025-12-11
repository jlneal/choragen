/**
 * @design-doc docs/design/core/features/web-chat-interface.md
 * @user-intent "Verify workflow history page groups workflows and links to chat threads"
 * @test-type unit
 */

import React from "react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import WorkflowHistoryPage from "@/app/chat/history/page";
import {
  formatStageProgress,
  groupWorkflowsByStatus,
} from "@/lib/workflow-history-utils";

const mockUseQuery = vi.fn();

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    workflow: {
      list: {
        useQuery: (...args: unknown[]) => mockUseQuery(...args),
      },
    },
  },
}));

vi.mock("@/components/chat/chat-page-wrapper", () => ({
  ChatPageWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ href, children }: { href: string; children: React.ReactNode }) =>
      React.createElement("a", { href }, children),
  };
});

describe("WorkflowHistoryPage", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
  });

  it("groups workflows by status in defined order", () => {
    const workflows = [
      { id: "WF-2", status: "paused" as const, updatedAt: "2025-01-02T00:00:00Z" },
      { id: "WF-1", status: "active" as const, updatedAt: "2025-01-03T00:00:00Z" },
      { id: "WF-3", status: "completed" as const, updatedAt: "2025-01-01T00:00:00Z" },
    ];

    const groups = groupWorkflowsByStatus(workflows);

    expect(groups.map((group) => group.status)).toEqual(["active", "paused", "completed"]);
    expect(groups[0].workflows[0].id).toBe("WF-1");
  });

  it("renders workflow cards with navigation links", () => {
    mockUseQuery.mockReturnValue({
      data: [
        {
          id: "WF-123",
          status: "active",
          requestId: "CR-123",
          currentStage: 1,
          stages: [{ name: "stage 1" }, { name: "stage 2" }],
          updatedAt: "2025-01-02T12:00:00Z",
        },
      ],
      isLoading: false,
      isRefetching: false,
      refetch: vi.fn(),
    });

    const html = renderToStaticMarkup(<WorkflowHistoryPage />);

    expect(html).toContain("WF-123");
    expect(html).toContain("CR-123");
    expect(html).toContain("Stage 2 of 2");
    expect(html).toContain("/chat/WF-123");
  });

  it("shows empty state when no workflows exist", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isRefetching: false,
      refetch: vi.fn(),
    });

    const html = renderToStaticMarkup(<WorkflowHistoryPage />);

    expect(html).toContain("No workflow activity yet");
    expect(html).toContain("/chat");
  });

  it("formats stage progress with guard rails", () => {
    expect(formatStageProgress(undefined, [])).toBe("No stages available");
    expect(formatStageProgress(-1, [{}, {}, {}])).toBe("Stage 1 of 3");
  });
});
