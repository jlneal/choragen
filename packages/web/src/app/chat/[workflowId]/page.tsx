// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md

import { ChatWorkflowContent } from "./chat-workflow-content";

import { ChatPageWrapper } from "@/components/chat/chat-page-wrapper";

interface ChatWorkflowPageProps {
  params: Promise<{ workflowId: string }>;
}

export default async function ChatWorkflowPage({ params }: ChatWorkflowPageProps) {
  const { workflowId } = await params;

  return (
    <ChatPageWrapper currentWorkflowId={workflowId}>
      <ChatWorkflowContent workflowId={workflowId} />
    </ChatPageWrapper>
  );
}
