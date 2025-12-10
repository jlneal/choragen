// ADR: ADR-011-web-api-architecture

import { RequestDetailClient } from "./request-detail-client";

interface RequestDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({
  params,
}: RequestDetailPageProps) {
  const { id } = await params;

  return <RequestDetailClient id={id} />;
}
