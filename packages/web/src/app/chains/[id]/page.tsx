// ADR: ADR-011-web-api-architecture

import { ChainDetailContent } from "./chain-detail-content";

interface ChainDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChainDetailPage({ params }: ChainDetailPageProps) {
  const { id } = await params;

  return <ChainDetailContent chainId={id} />;
}
