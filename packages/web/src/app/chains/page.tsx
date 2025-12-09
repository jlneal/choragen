// ADR: ADR-011-web-api-architecture

import { GitBranch, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ChainsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Task Chains</h1>
        <p className="text-muted-foreground">
          View and manage your task chains and their progress
        </p>
      </div>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Chain Management
          </CardTitle>
          <CardDescription>
            Task chains provide traceability, context preservation, and progress
            tracking for multi-session work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              This page will display all active and completed task chains. You
              will be able to create new chains, view chain details, and track
              task progress.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
