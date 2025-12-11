// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { WorkflowSwitcher } from "./workflow-switcher";

interface ChatPageWrapperProps {
  children: ReactNode;
  currentWorkflowId?: string;
}

/**
 * Shared wrapper for chat pages.
 * Provides consistent page heading, workflow switcher, and spacing.
 */
export function ChatPageWrapper({ children, currentWorkflowId }: ChatPageWrapperProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Workflow Chat</h1>
          <p className="text-muted-foreground">
            Converse with workflows, monitor conversations, and approve gates from one
            place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/chat"
            className="text-sm text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground"
          >
            Active chats
          </Link>
          <WorkflowSwitcher currentWorkflowId={currentWorkflowId} />
        </div>
      </div>

      <div className="space-y-6">{children}</div>
    </div>
  );
}
