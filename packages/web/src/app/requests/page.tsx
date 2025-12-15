// ADR: ADR-011-web-api-architecture

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus } from "lucide-react";

import { RequestList } from "@/components/requests";
import { BacklogCount } from "@/components/requests/backlog-count";
import { Button } from "@/components/ui/button";

export default function RequestsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
          <p className="text-muted-foreground">
            Browse change requests and fix requests across your workspace
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BacklogCount />
          <Button asChild>
            <Link href="/requests/new">
              <Plus className="h-4 w-4" />
              New Request
            </Link>
          </Button>
        </div>
      </div>

      {/* Request List */}
      <RequestList />
    </div>
  );
}
