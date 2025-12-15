// ADR: ADR-011-web-api-architecture

export const dynamic = "force-dynamic";

import { ChainCreator } from "@/components/chains/chain-creator";

export default function NewChainPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Chain</h1>
        <p className="text-muted-foreground">
          Create a new task chain linked to a request
        </p>
      </div>

      {/* Chain Creator */}
      <ChainCreator />
    </div>
  );
}
