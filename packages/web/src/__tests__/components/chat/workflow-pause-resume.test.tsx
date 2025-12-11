/**
 * @design-doc docs/design/core/features/web-chat-interface.md
 * @user-intent "Verify pause/resume controls render for correct workflow states and trigger mutations"
 * @test-type unit
 */

import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";

import { WorkflowActions } from "@/components/chat/workflow-actions";

const { pauseMutateMock, resumeMutateMock, cancelMutateMock } = vi.hoisted(() => ({
  pauseMutateMock: vi.fn(),
  resumeMutateMock: vi.fn(),
  cancelMutateMock: vi.fn(),
}));

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    useUtils: () => ({
      workflow: {
        get: { invalidate: vi.fn() },
        list: { invalidate: vi.fn() },
        getHistory: { invalidate: vi.fn() },
      },
    }),
    workflow: {
      pause: {
        useMutation: () => ({ mutate: pauseMutateMock, isPending: false }),
      },
      resume: {
        useMutation: () => ({ mutate: resumeMutateMock, isPending: false }),
      },
      cancel: {
        useMutation: () => ({ mutate: cancelMutateMock, isPending: false }),
      },
    },
  },
}));

describe("WorkflowActions pause/resume", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows pause and cancel controls for active workflow", () => {
    const html = renderToStaticMarkup(<WorkflowActions workflowId="WF-1" status="active" />);

    expect(html).toContain("Pause");
    expect(html).toContain("Cancel workflow");
  });

  it("shows resume control for paused workflow", () => {
    const html = renderToStaticMarkup(<WorkflowActions workflowId="WF-2" status="paused" />);

    expect(html).toContain("Resume");
    expect(html).not.toContain("Pause");
  });

  it("hides controls for completed workflow", () => {
    const html = renderToStaticMarkup(<WorkflowActions workflowId="WF-5" status="completed" />);

    expect(html).not.toContain("Pause");
    expect(html).not.toContain("Resume");
    expect(html).not.toContain("Cancel workflow");
  });
});
