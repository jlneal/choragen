/**
 * @design-doc docs/design/core/features/web-chat-interface.md
 * @user-intent "Verify WorkflowSwitcher lists workflows and shows current selection"
 * @test-type unit
 */

import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { WorkflowSwitcher } from "@/components/chat/workflow-switcher";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/chat",
}));

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    workflow: {
      list: {
        useQuery: () => ({
          data: [
            { id: "WF-1", requestId: "CR-1", template: "standard", status: "active" },
            { id: "WF-2", requestId: "CR-2", template: "standard", status: "paused" },
          ],
          isLoading: false,
        }),
      },
    },
  },
}));

describe("WorkflowSwitcher", () => {
  it("renders current workflow label", () => {
    const html = renderToStaticMarkup(<WorkflowSwitcher currentWorkflowId="WF-1" />);

    expect(html).toContain("WF-1");
  });

  it("shows placeholder when no workflow selected", () => {
    const html = renderToStaticMarkup(<WorkflowSwitcher />);

    expect(html).toContain("Select workflow");
  });
});
