// ADR: ADR-011-web-api-architecture

import { SessionDetailContent } from "./session-detail-content";

interface SessionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({
  params,
}: SessionDetailPageProps) {
  const { id } = await params;

  return <SessionDetailContent sessionId={id} />;
}
