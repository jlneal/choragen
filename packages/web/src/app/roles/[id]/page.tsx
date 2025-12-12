// ADR: ADR-011-web-api-architecture
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, RefreshCcw } from "lucide-react";

import { RoleEditor } from "@/components/roles/role-editor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

export default function RoleEditorPage() {
  const params = useParams<{ id: string }>();
  const roleId = Array.isArray(params?.id) ? params?.id[0] : params?.id;

  const {
    data: role,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.roles.get.useQuery(roleId ?? "", {
    enabled: Boolean(roleId),
  });

  if (!roleId) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Invalid role ID
          </CardTitle>
          <CardDescription>
            A valid role identifier is required to edit a role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href="/roles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to roles
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isError || (!isLoading && !role)) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Unable to load role
          </CardTitle>
          <CardDescription>
            {error instanceof Error ? error.message : "Role not found or failed to load."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Retry
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/roles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to roles
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <RoleEditor mode="edit" roleId={roleId} role={role} />;
}
