// ADR: ADR-011-web-api-architecture

import { GitSection } from "@/components/git/git-section";

export default function GitPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Git</h1>
        <p className="text-muted-foreground">
          Stage changes, commit with CR/FR references, and view history
        </p>
      </div>

      {/* Git Section with full history */}
      <GitSection showHistory={true} historyLimit={20} />
    </div>
  );
}
