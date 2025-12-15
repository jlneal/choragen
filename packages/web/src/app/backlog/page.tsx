// ADR: ADR-011-web-api-architecture

export const dynamic = "force-dynamic";

import { BacklogList } from "@/components/requests/backlog-list";

export default function BacklogPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Backlog</h1>
        <p className="text-muted-foreground">
          Low-priority requests and ideas not yet scheduled for work
        </p>
      </div>

      {/* Backlog List */}
      <BacklogList />
    </div>
  );
}
