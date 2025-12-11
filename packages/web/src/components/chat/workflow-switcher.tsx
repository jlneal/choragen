// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, GitBranch, Loader2 } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WorkflowSwitcherProps {
  currentWorkflowId?: string;
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "paused"
      ? "secondary"
      : status === "active"
        ? "default"
        : "outline";
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

export function WorkflowSwitcher({ currentWorkflowId }: WorkflowSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { data: workflows, isLoading } = trpc.workflow.list.useQuery({ status: "active" });

  const options = useMemo(() => {
    if (!workflows) return [];
    return workflows.map((workflow) => ({
      id: workflow.id,
      requestId: workflow.requestId,
      title: workflow.template ?? "Workflow",
      status: workflow.status,
    }));
  }, [workflows]);

  const currentLabel =
    options.find((w) => w.id === currentWorkflowId)?.id || currentWorkflowId || "Select workflow";

  const handleSelect = (workflowId: string) => {
    if (pathname?.endsWith(workflowId)) return;
    router.push(`/chat/${workflowId}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-mono text-xs">{currentLabel}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
          Active workflows
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">Loading workflows…</div>
        ) : options.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">No active workflows</div>
        ) : (
          options.map((workflow) => {
            const isCurrent = workflow.id === currentWorkflowId;
            return (
              <DropdownMenuItem
                key={workflow.id}
                className={cn(
                  "flex flex-col items-start gap-1 py-2",
                  isCurrent ? "bg-primary/5" : undefined
                )}
                onSelect={() => handleSelect(workflow.id)}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-mono text-xs">{workflow.id}</span>
                  <StatusBadge status={workflow.status} />
                </div>
                <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                  <span>{workflow.requestId ?? "Unlinked"}</span>
                  <span className="truncate">{workflow.title}</span>
                </div>
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2 text-sm"
          disabled
          onSelect={(event) => event.preventDefault()}
        >
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          Start New Workflow (soon)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
