/**
 * @design-doc docs/design/core/features/agent-feedback.md
 * @user-intent "Feedback panel lists, filters, sorts, and renders empty state"
 * @test-type unit
 */

import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import type { FeedbackItem } from "@choragen/core";
import { FeedbackPanel, sortFeedbackItems } from "./FeedbackPanel";

const mockFeedback: FeedbackItem[] = [
  createFeedback({
    id: "FB-001",
    priority: "high",
    type: "blocker",
    updatedAt: new Date("2025-01-02T00:00:00Z"),
  }),
  createFeedback({
    id: "FB-002",
    priority: "medium",
    type: "question",
    updatedAt: new Date("2025-01-03T00:00:00Z"),
  }),
  createFeedback({
    id: "FB-003",
    priority: "low",
    type: "idea",
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  }),
];

const mockUtils = {
  feedback: {
    list: { invalidate: vi.fn() },
    get: { invalidate: vi.fn() },
  },
};

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    feedback: {
      list: {
        useQuery: vi.fn(() => ({
          data: mockFeedback,
          isLoading: false,
          refetch: vi.fn(),
        })),
      },
    },
    useUtils: () => mockUtils,
  },
}));

function createFeedback(overrides: Partial<FeedbackItem>): FeedbackItem {
  return {
    id: "FB-default",
    workflowId: "WF-1",
    stageIndex: 0,
    type: "clarification",
    createdByRole: "impl",
    content: "content",
    status: "pending",
    priority: "medium",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("FeedbackPanel helpers", () => {
  it("sorts feedback by priority rank", () => {
    const sorted = sortFeedbackItems(mockFeedback, "priority");
    expect(sorted[0].id).toBe("FB-001");
    expect(sorted[1].id).toBe("FB-002");
    expect(sorted[2].id).toBe("FB-003");
  });

  it("sorts feedback by type alphabetically", () => {
    const sorted = sortFeedbackItems(mockFeedback, "type");
    expect(sorted.map((f) => f.type)).toEqual(["blocker", "idea", "question"]);
  });
});

  describe("FeedbackPanel", () => {
    it("renders list of feedback items", () => {
      const html = renderToStaticMarkup(<FeedbackPanel workflowId="WF-1" />);
      expect(html).toContain("Feedback");
      expect(html).toContain("blocker");
      expect(html).toContain("question");
    });
  });
