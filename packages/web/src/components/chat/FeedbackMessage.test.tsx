/**
 * @design-doc docs/design/core/features/agent-feedback.md
 * @user-intent "Render feedback messages with context, options, and actions"
 * @test-type unit
 */

import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import type { FeedbackItem } from "@choragen/core";
import { FeedbackMessage } from "./FeedbackMessage";

const mockUtils = {
  feedback: {
    list: { invalidate: vi.fn() },
    get: { invalidate: vi.fn() },
  },
};

const baseMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
  error: null,
};

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    feedback: {
      respond: {
        useMutation: vi.fn(() => ({
          ...baseMutation,
          mutateAsync: vi.fn().mockResolvedValue(undefined),
        })),
      },
      dismiss: {
        useMutation: vi.fn(() => ({
          ...baseMutation,
          mutateAsync: vi.fn().mockResolvedValue(undefined),
        })),
      },
    },
    useUtils: () => mockUtils,
  },
}));

function createFeedback(overrides: Partial<FeedbackItem> = {}): FeedbackItem {
  return {
    id: "FB-001",
    workflowId: "WF-001",
    stageIndex: 0,
    type: "clarification",
    createdByRole: "impl",
    content: "Need more details about API versioning.",
    status: "pending",
    priority: "medium",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    context: {
      files: ["src/api/client.ts"],
      codeSnippets: [
        {
          file: "src/api/client.ts",
          startLine: 10,
          endLine: 12,
          content: "export async function fetchData() {}",
        },
      ],
      options: [
        { label: "v1", description: "Use legacy API" },
        { label: "v2", description: "Use new API", recommended: true },
      ],
    },
    ...overrides,
  };
}

describe("FeedbackMessage", () => {
  it("renders pending feedback with context and options", () => {
    const html = renderToStaticMarkup(
      <FeedbackMessage feedback={createFeedback()} workflowId="WF-001" />
    );

    expect(html).toContain("Clarification");
    expect(html).toContain("Need more details about API versioning.");
    expect(html).toContain("src/api/client.ts");
    expect(html).toContain("Use new API");
    expect(html).toContain("Recommended");
  });

  it("renders resolved feedback with response content", () => {
    const html = renderToStaticMarkup(
      <FeedbackMessage
        feedback={createFeedback({
          status: "resolved",
          response: {
            content: "Please use v2",
            respondedBy: "reviewer",
            respondedAt: new Date("2025-01-02T00:00:00Z"),
            selectedOption: "v2",
          },
        })}
      />
    );

    expect(html).toContain("Resolved");
    expect(html).toContain("Please use v2");
    expect(html).toContain("Selected option");
  });

  it("shows response form when defaultOpenResponse is true", () => {
    const html = renderToStaticMarkup(
      <FeedbackMessage feedback={createFeedback()} defaultOpenResponse />
    );

    expect(html).toContain("Write a response");
  });
});
