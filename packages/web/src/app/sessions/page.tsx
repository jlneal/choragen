// ADR: ADR-011-web-api-architecture

import { Bot, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agent Sessions</h1>
        <p className="text-muted-foreground">
          Monitor active and past agent sessions
        </p>
      </div>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Session Tracking
          </CardTitle>
          <CardDescription>
            Agent sessions represent individual work periods. Each session
            declares a role (impl or control) and operates within defined
            boundaries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              This page will display agent session history, including role
              declarations, task assignments, and session outcomes. Track how
              work flows between control and implementation agents.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
