// ADR: ADR-011-web-api-architecture

import { RequestForm } from "@/components/requests";

export default function NewRequestPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Request</h1>
        <p className="text-muted-foreground">
          Create a new change request or fix request
        </p>
      </div>

      {/* Request Form */}
      <RequestForm />
    </div>
  );
}
