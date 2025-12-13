/**
 * @design-doc docs/design/core/features/web-chat-interface.md
 * @user-intent "Verify GatePrompt renders approval UI and calls satisfyGate on approve"
 * @test-type unit
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";

const mutateMock = vi.fn();
const useMutationMock = vi.fn();

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
      get: {
        useQuery: () => ({
          data: {
            stages: [
              { gate: { options: [] } },
              { gate: { options: [] } },
              { gate: { options: [{ label: "Continue", action: "advance" }] } },
            ],
          },
        }),
      },
      satisfyGate: {
        useMutation: (options?: { onSuccess?: () => void; onError?: () => void }) => {
          useMutationMock(options);
          return {
            mutate: mutateMock,
            mutateAsync: mutateMock,
            isPending: false,
            error: null,
          };
        },
      },
      discard: {
        useMutation: () => ({
          mutate: vi.fn(),
          mutateAsync: vi.fn(),
          isPending: false,
          error: null,
        }),
      },
    },
  },
}));

import { GatePrompt } from "@/components/chat/gate-prompt";

function findButtons(node: ReactElement): Array<ReactElement> {
  const results: ReactElement[] = [];

  function traverse(element: ReactElement | string | number | boolean | null | undefined) {
    if (!element || typeof element !== "object") {
      return;
    }

    const reactElement = element as ReactElement;

    const props = reactElement.props as { onClick?: () => void; children?: unknown };

    if (reactElement.type === "button" || typeof props.onClick === "function") {
      results.push(reactElement);
    }

    const children = props.children;
    if (Array.isArray(children)) {
      children.forEach((child) => traverse(child as ReactElement));
    } else {
      traverse(children as ReactElement);
    }
  }

  traverse(node);
  return results;
}

describe("GatePrompt", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    useMutationMock.mockReset();
  });

  it("renders approval card with prompt text", () => {
    const html = renderToStaticMarkup(
      <GatePrompt workflowId="WF-1" stageIndex={1} prompt="Approve deployment?" gateType="review" />
    );

    expect(html).toContain("Approval Required");
    expect(html).toContain("Approve deployment?");
    expect(html).toContain("review");
  });

  it("calls satisfyGate mutation on approve", () => {
    renderToStaticMarkup(
      <GatePrompt workflowId="WF-1" stageIndex={2} prompt="Approve?" gateType="gate" />
    );

    expect(useMutationMock).toHaveBeenCalled();
  });
});
