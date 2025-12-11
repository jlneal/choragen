/**
 * @design-doc docs/design/core/features/web-chat-interface.md
 * @user-intent "Verify ArtifactLink renders with icon, link, and preview when expanded"
 * @test-type unit
 */

import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { ArtifactLink } from "@/components/chat/artifact-link";

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    requests: {
      get: {
        useQuery: () => ({
          data: { id: "CR-123", title: "Add feature", status: "todo" },
          isLoading: false,
          error: null,
        }),
      },
    },
    chains: {
      get: {
        useQuery: () => ({
          data: { id: "CH-1", title: "Chain", status: "in-progress", tasks: [] },
          isLoading: false,
          error: null,
        }),
      },
    },
    tasks: {
      get: {
        useQuery: () => ({
          data: { id: "T-1", chainId: "CH-1", title: "Task", status: "todo" },
          isLoading: false,
          error: null,
        }),
      },
    },
  },
}));

describe("ArtifactLink", () => {
  it("renders collapsed by default with icon and text", () => {
    const html = renderToStaticMarkup(
      <ArtifactLink artifactType="cr" artifactId="CR-123" title="Change Request" />
    );

    expect(html).toContain("CR-123");
    expect(html).toContain("Change Request");
    expect(html).toContain('data-type="cr"');
    expect(html).toContain("lucide-chevron-down");
    expect(html).not.toContain("View request");
  });

  it("renders preview when defaultExpanded is true", () => {
    const html = renderToStaticMarkup(
      <ArtifactLink
        artifactType="cr"
        artifactId="CR-123"
        title="Change Request"
        defaultExpanded
      />
    );

    expect(html).toContain("View request");
    expect(html).toContain("Add feature");
  });
});
