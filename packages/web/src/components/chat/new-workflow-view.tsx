// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BacklogSelector } from "./backlog-selector";
import { useProviderStatus } from "@/hooks/use-provider-status";
import { ProviderRequiredBanner } from "./provider-required-banner";

const DEFAULT_TEMPLATE = "standard";

export function NewWorkflowView() {
  const router = useRouter();
  const [intent, setIntent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { isConfigured, isLoading: isProviderLoading, refresh } = useProviderStatus();

  const createWorkflow = trpc.workflow.create.useMutation({
    onSuccess: (workflow) => {
      router.push(`/chat/${workflow.id}`);
    },
    onError: (mutationError) => {
      setError(mutationError.message || "Failed to start workflow");
    },
  });

  const handleStartFromIntent = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isConfigured) {
      setError("Configure a provider before starting a workflow.");
      return;
    }
    if (!intent.trim()) {
      setError("Please describe what you want to accomplish.");
      return;
    }

    setError(null);
    // In a full implementation, we'd create a CR from intent; for now, pass intent as requestId placeholder.
    createWorkflow.mutate({
      requestId: intent.trim(),
      template: DEFAULT_TEMPLATE,
    });
  };

  const handleSelectRequest = (requestId: string) => {
    setError(null);
    createWorkflow.mutate({
      requestId,
      template: DEFAULT_TEMPLATE,
    });
  };

  const isSubmitting = createWorkflow.isPending;

  return (
    <div className="space-y-6">
      {!isConfigured ? (
        <ProviderRequiredBanner
          onRefresh={refresh}
          message="No LLM provider configured. Add a provider before starting a workflow."
        />
      ) : null}
      <Card className="border-primary/40">
        <CardHeader className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Start a workflow
          </div>
          <CardTitle>Guide an agent with natural language</CardTitle>
          <CardDescription>
            Describe your intent and we&apos;ll spin up a workflow using the standard template.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleStartFromIntent}>
          <CardContent className="space-y-3">
            <Input
              value={intent}
              onChange={(event) => setIntent(event.target.value)}
              placeholder="e.g., Refactor API error handling and add tests"
              disabled={isSubmitting || !isConfigured || isProviderLoading}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </CardContent>
          <CardFooter className="flex items-center gap-2">
            <Button type="submit" disabled={isSubmitting || !isConfigured || isProviderLoading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                "Start workflow"
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Uses the standard workflow template.
            </p>
          </CardFooter>
        </form>
      </Card>

      <BacklogSelector
        onSelect={handleSelectRequest}
        disabled={isSubmitting || !isConfigured || isProviderLoading}
      />
    </div>
  );
}
