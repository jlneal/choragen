/**
 * @design-doc docs/design/core/features/web-chat-interface.md
 * @user-intent "Verify navigation links to workflows appear when associations exist"
 * @test-type unit
 */

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { SessionCard, type Session } from "@/components/sessions/session-card";
import { ChainCard } from "@/components/chains/chain-card";

describe("Navigation links to workflows", () => {
  it("shows workflow link on session card when workflowId present", () => {
    const session: Session = {
      chainId: "CHAIN-001",
      workflowId: "WF-123",
      agent: "impl",
      startedAt: new Date("2025-01-01T00:00:00Z"),
      files: [],
    };

    const html = renderToStaticMarkup(<SessionCard session={session} />);

    expect(html).toContain("/chat/WF-123");
    expect(html).toContain("Workflow WF-123");
  });

  it("hides workflow link on session card when absent", () => {
    const session: Session = {
      chainId: "CHAIN-002",
      agent: "control",
      startedAt: new Date("2025-01-01T00:00:00Z"),
      files: [],
    };

    const html = renderToStaticMarkup(<SessionCard session={session} />);

    expect(html).not.toContain("/chat/");
    expect(html).not.toContain("Workflow");
  });

  it("shows workflow link on chain card when workflowId present", () => {
    const html = renderToStaticMarkup(
      <ChainCard
        id="CHAIN-003"
        title="Test chain"
        requestId="CR-123"
        taskCount={3}
        progress={50}
        status="active"
        workflowId="WF-456"
      />
    );

    expect(html).toContain("/chat/WF-456");
    expect(html).toContain("WF-456");
  });

  it("hides workflow link on chain card when absent", () => {
    const html = renderToStaticMarkup(
      <ChainCard
        id="CHAIN-004"
        title="No workflow"
        requestId="CR-124"
        taskCount={2}
        progress={20}
        status="paused"
      />
    );

    expect(html).not.toContain("/chat/WF");
  });
});
