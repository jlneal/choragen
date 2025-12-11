/**
 * @design-doc docs/design/core/features/web-chat-interface.md
 * @user-intent "Ensure workflows can be cancelled with confirmation and active-only visibility"
 * @test-type unit
 */

import { describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CancelDialog } from "@/components/chat/cancel-dialog";
import { WorkflowActions } from "@/components/chat/workflow-actions";

const { mutateMock, useMutationMock, toastMock } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  useMutationMock: vi.fn(),
  toastMock: {
    success: vi.fn(),
    error: vi.fn(),
  },
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
      pause: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      resume: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      cancel: {
        useMutation: useMutationMock,
      },
    },
  },
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

describe("Workflow cancel actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders cancellation dialog copy", () => {
    const element = CancelDialog({
      open: true,
      onOpenChange: () => undefined,
      onConfirm: () => undefined,
    } as Parameters<typeof CancelDialog>[0]);

    const textContent = collectText(element);

    expect(textContent).toContain("Cancel this workflow?");
    expect(textContent).toContain("cannot be undone");
  });

  it("wires confirm action to provided callback", () => {
    const onConfirm = vi.fn();
    const element = CancelDialog({
      open: true,
      onOpenChange: () => undefined,
      onConfirm,
    } as Parameters<typeof CancelDialog>[0]);

    const clickHandlers = findClickHandlers(element);
    clickHandlers.forEach((handler) => handler());

    expect(onConfirm).toHaveBeenCalled();
  });

  it("shows cancel action for active workflows only", () => {
    useMutationMock.mockReturnValue({ mutate: mutateMock, isPending: false });

    const activeHtml = renderToStaticMarkup(
      <WorkflowActions workflowId="WF-1" status="active" />
    );
    const completedHtml = renderToStaticMarkup(
      <WorkflowActions workflowId="WF-2" status="completed" />
    );

    expect(activeHtml).toContain("Cancel workflow");
    expect(completedHtml).not.toContain("Cancel workflow");
  });
});

function findClickHandlers(node: ReactElement): Array<() => void> {
  const handlers: Array<() => void> = [];

  function traverse(element: ReactElement | string | number | boolean | null | undefined) {
    if (!element || typeof element !== "object") return;

    const props = (element as ReactElement).props as { onClick?: () => void; children?: unknown };

    if (typeof props.onClick === "function") {
      handlers.push(props.onClick);
    }

    const children = props.children;
    if (Array.isArray(children)) {
      children.forEach((child) => traverse(child as ReactElement));
    } else {
      traverse(children as ReactElement);
    }
  }

  traverse(node);
  return handlers;
}

function collectText(node: ReactElement | string | number | boolean | null | undefined): string {
  if (!node) return "";
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  const props = (node as ReactElement).props as { children?: unknown };
  const children = props.children;

  if (!children) return "";

  if (Array.isArray(children)) {
    return children.map((child) => collectText(child as ReactElement)).join(" ");
  }

  return collectText(children as ReactElement);
}
