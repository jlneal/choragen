// ADR: ADR-011-web-api-architecture
"use client";

import { useMemo } from "react";

import Link from "next/link";
import { AlertTriangle, Plus, RefreshCcw, Wrench } from "lucide-react";

import { RoleCard, RoleCardSkeleton } from "@/components/roles/role-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

interface RoleResponse {
  id: string;
  name: string;
  description?: string;
  toolIds: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface RoleItem {
  id: string;
  name: string;
  description?: string;
  toolCount: number;
  createdAt: Date;
  updatedAt: Date;
}

function parseDate(value?: string | Date): Date {
  if (!value) return new Date(Number.NaN);
  return value instanceof Date ? value : new Date(value);
}

function toRoleItem(role: RoleResponse): RoleItem {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    toolCount: role.toolIds?.length ?? 0,
    createdAt: parseDate(role.createdAt),
    updatedAt: parseDate(role.updatedAt),
  };
}

function RoleListSkeleton() {
  const count = 6;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <RoleCardSkeleton key={index} />
      ))}
    </div>
  );
}

function RoleListEmpty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="rounded-full bg-muted p-4">
          <Wrench className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">No roles yet</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Roles define which tools are available to agents at each workflow stage.
            Create your first role to start controlling tool access.
          </p>
        </div>
        <Button asChild>
          <Link href="/roles/new">
            <Plus className="h-4 w-4" />
            Create role
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function RoleListError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-destructive/10 p-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-destructive">Unable to load roles</h3>
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t fetch roles from the server. Check your connection and try again.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry} className="w-full sm:w-auto">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

export default function RolesPage() {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = trpc.roles.list.useQuery();

  const roles = useMemo(
    () => (data as RoleResponse[] | undefined)?.map(toRoleItem) ?? [],
    [data]
  );

  const showSkeleton = isLoading && !data;
  const hasError = Boolean(error);
  const hasRoles = roles.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
          <p className="text-muted-foreground">
            Browse and manage the roles that define which tools agents can use.
          </p>
        </div>
        <div className="flex w-full justify-end sm:w-auto">
          <Button asChild>
            <Link href="/roles/new">
              <Plus className="h-4 w-4" />
              Create Role
            </Link>
          </Button>
        </div>
      </div>

      {hasError ? (
        <RoleListError onRetry={() => void refetch()} />
      ) : showSkeleton ? (
        <RoleListSkeleton />
      ) : hasRoles ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              id={role.id}
              name={role.name}
              description={role.description}
              toolCount={role.toolCount}
              createdAt={role.createdAt}
              updatedAt={role.updatedAt}
            />
          ))}
        </div>
      ) : (
        <RoleListEmpty />
      )}
    </div>
  );
}
