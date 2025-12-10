// ADR: ADR-011-web-api-architecture

import { RequestList } from "@/components/requests";

export default function RequestsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
        <p className="text-muted-foreground">
          Browse change requests and fix requests across your workspace
        </p>
      </div>

      {/* Request List */}
      <RequestList />
    </div>
  );
}
