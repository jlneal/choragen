// ADR: ADR-011-web-api-architecture

import { Bot, Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Empty state when no sessions match current filters.
 */
export function SessionListEmpty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          No sessions match your current filters. Try adjusting your filters or
          wait for agents to start new sessions.
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Empty state when there are no sessions at all.
 */
export function SessionListNoSessions() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Bot className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No active sessions</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Agent sessions represent individual work periods. When an agent
          acquires a lock and starts working on a chain, it will appear here.
          Sessions show role declarations, file locks, and timing information.
        </p>
      </CardContent>
    </Card>
  );
}
