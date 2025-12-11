/**
 * @design-doc docs/design/core/features/web-chat-interface.md
 * @user-intent "Verify WorkflowSidebar renders stages, artifacts, and metrics"
 * @test-type unit
 */

import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { WorkflowSidebar } from "@/components/chat/workflow-sidebar";

const invalidateMock = vi.fn();

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
      cancel: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
      pause: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
      resume: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
    },
  },
}));

const stages = [
  { name: "Plan", status: "completed" },
  { name: "Implement", status: "active" },
  { name: "Review", status: "pending" },
];

const messages = [
  {
    id: "m1",
    role: "impl" as const,
    content: "Artifact created",
    stageIndex: 1,
    timestamp: new Date("2025-01-01T00:00:00Z"),
    metadata: {
      type: "artifact",
      artifactType: "cr",
      artifactId: "CR-2025",
      title: "Change Request",
    },
  },
];

describe("WorkflowSidebar", () => {
  it("renders stages, artifacts, and metrics", () => {
    const html = renderToStaticMarkup(
      <WorkflowSidebar
        workflowId="WF-1"
        requestId="CR-2025"
        status="active"
        template="standard"
        stageSummary="Stage 2 of 3"
        updatedAt={new Date("2025-01-02T00:00:00Z")}
        stages={stages}
        currentStageIndex={1}
        messages={messages as never}
        createdAt={new Date("2025-01-01T00:00:00Z")}
      />
    );

    expect(html).toContain("Workflow details");
    expect(html).toContain("Stage 2 of 3");
    expect(html).toContain("Plan");
    expect(html).toContain("Implement");
    expect(html).toContain("Review");
    expect(html).toContain("CR-2025");
    expect(html).toContain("Messages");
  });
});
