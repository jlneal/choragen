/**
 * @design-doc docs/design/core/features/web-chat-interface.md
 * @user-intent "Verify chat errors render friendly messaging with retry and dismiss controls"
 * @test-type unit
 */

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { ErrorMessage } from "@/components/chat/error-message";

describe("ErrorMessage", () => {
  it("shows icon, title, and descriptive copy with red accent", () => {
    const html = renderToStaticMarkup(
      <ErrorMessage message="Unable to load workflow messages" title="Workflow error" />
    );

    expect(html).toContain("Workflow error");
    expect(html).toContain("Unable to load workflow messages");
    expect(html).toContain("text-destructive");
    expect(html).toContain("border-destructive/30");
  });

  it("renders retry button for recoverable issues", () => {
    const html = renderToStaticMarkup(
      <ErrorMessage message="Temporary issue" onRetry={() => undefined} />
    );

    expect(html).toContain("Retry");
  });

  it("renders dismiss control for non-critical issues", () => {
    const html = renderToStaticMarkup(
      <ErrorMessage message="Minor issue" onDismiss={() => undefined} />
    );

    expect(html).toContain('aria-label="Dismiss error"');
  });

  it("shows network copy with auto-retry hint", () => {
    const html = renderToStaticMarkup(
      <ErrorMessage
        variant="network"
        message="Connection lost. Reconnecting to workflow."
        autoRetry
        retryLabel="Retry now"
        onRetry={() => undefined}
      />
    );

    expect(html).toContain("Connection lost");
    expect(html).toContain("Retry now");
    expect(html).toContain("automatically");
  });
});
