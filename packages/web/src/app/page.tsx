// ADR: ADR-011-web-api-architecture

import { Activity, GitBranch, CheckCircle2, Clock } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Choragen Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage your agentic development workflows
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<GitBranch className="h-5 w-5" />}
            label="Active Chains"
            value="—"
          />
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            label="Tasks In Progress"
            value="—"
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Completed Today"
            value="—"
          />
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label="Pending Review"
            value="—"
          />
        </div>

        {/* Placeholder Content */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <p className="text-muted-foreground">
            This dashboard will display task chains, governance status, and
            metrics from your Choragen workspace. The tRPC API layer is being
            set up to connect to @choragen/core.
          </p>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
