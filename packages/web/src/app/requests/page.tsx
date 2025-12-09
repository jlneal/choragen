// ADR: ADR-011-web-api-architecture

import { FileText, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RequestsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
        <p className="text-muted-foreground">
          Browse change requests and fix requests across your workspace
        </p>
      </div>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Request Management
          </CardTitle>
          <CardDescription>
            Requests drive all work in Choragen. Change Requests (CRs) add new
            features, while Fix Requests (FRs) address bugs and issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              This page will display all change requests and fix requests. You
              will be able to filter by status, view request details, and track
              associated commits.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
