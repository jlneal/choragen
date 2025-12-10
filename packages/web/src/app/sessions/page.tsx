// ADR: ADR-011-web-api-architecture

import { SessionList } from "@/components/sessions/session-list";

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agent Sessions</h1>
        <p className="text-muted-foreground">
          Monitor active agent sessions. Each session represents an agent
          working on a chain with file locks.
        </p>
      </div>

      {/* Session List */}
      <SessionList />
    </div>
  );
}
