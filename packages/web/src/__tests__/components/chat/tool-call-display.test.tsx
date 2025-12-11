/**
 * @design-doc docs/design/core/features/web-chat-interface.md
 * @user-intent "Verify ToolCallDisplay collapses/expands and renders tool call details"
 * @test-type unit
 */

import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { ToolCallDisplay } from "@/components/chat/tool-call-display";

describe("ToolCallDisplay", () => {
  const toolCalls = [
    { name: "fs.readFile", args: { path: "file.txt" }, result: "content", status: "success" as const },
    { name: "git.status", args: {}, result: { clean: true }, status: "success" as const },
  ];

  it("renders collapsed state with tool name", () => {
    const html = renderToStaticMarkup(<ToolCallDisplay toolCalls={[toolCalls[0]]} />);

    expect(html).toContain("fs.readFile");
    expect(html).toContain("lucide-chevron-right");
    expect(html).not.toContain("content");
  });

  it("renders expanded details when defaultExpanded is true", () => {
    const html = renderToStaticMarkup(
      <ToolCallDisplay toolCalls={toolCalls} defaultExpanded />
    );

    expect(html).toContain("fs.readFile");
    expect(html).toContain("git.status");
    expect(html).toContain("content");
    expect(html).toContain("&quot;clean&quot;: true");
    expect(html).toContain("lucide-chevron-down");
  });
});
