// ADR: ADR-011-web-api-architecture

export const dynamic = "force-dynamic";

import { Activity, GitBranch, CheckCircle2, Clock, FileText, Bot } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GitSectionCompact } from "@/components/git/git-section";

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and manage your agentic development workflows
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<GitBranch className="h-4 w-4" />}
          label="Active Chains"
          value="—"
        />
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          label="Tasks In Progress"
          value="—"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Completed Today"
          value="—"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Pending Review"
          value="—"
        />
      </div>

      {/* Git Section */}
      <GitSectionCompact />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates from your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ActivityItem
              icon={<GitBranch className="h-4 w-4" />}
              title="Chain activity"
              description="No recent chain activity"
              time="—"
            />
            <ActivityItem
              icon={<FileText className="h-4 w-4" />}
              title="Request updates"
              description="No recent request updates"
              time="—"
            />
            <ActivityItem
              icon={<Bot className="h-4 w-4" />}
              title="Agent sessions"
              description="No recent agent sessions"
              time="—"
            />
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Connect your workspace to see live data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This dashboard will display task chains, governance status, and
            metrics from your Choragen workspace. The tRPC API layer is being
            set up to connect to @choragen/core.
          </p>
        </CardContent>
      </Card>
    </div>
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function ActivityItem({
  icon,
  title,
  description,
  time,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="rounded-full bg-muted p-2">
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground">{time}</span>
    </div>
  );
}
