// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Lightbulb } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { BacklogSelector } from "./backlog-selector";
import { useProviderStatus } from "@/hooks/use-provider-status";
import { ProviderRequiredBanner } from "./provider-required-banner";

export function NewWorkflowView() {
  const router = useRouter();
  const [intent, setIntent] = useState("");
  const [ideaText, setIdeaText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ideation" | "standard">("ideation");
  const { isConfigured, isLoading: isProviderLoading, refresh } = useProviderStatus();

  const createWorkflow = trpc.workflow.create.useMutation({
    onSuccess: (workflow) => {
      router.push(`/chat/${workflow.id}`);
    },
    onError: (mutationError) => {
      setError(mutationError.message || "Failed to start workflow");
    },
  });

  const handleStartIdeation = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isConfigured) {
      setError("Configure a provider before starting a workflow.");
      return;
    }
    if (!ideaText.trim()) {
      setError("Please describe your idea.");
      return;
    }

    setError(null);
    createWorkflow.mutate({
      requestId: `idea-${Date.now()}`,
      template: "ideation",
      initialMessage: ideaText.trim(),
    });
  };

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
    createWorkflow.mutate({
      requestId: intent.trim(),
      template: "standard",
    });
  };

  const handleSelectRequest = (requestId: string) => {
    setError(null);
    createWorkflow.mutate({
      requestId,
      template: "standard",
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

      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as "ideation" | "standard")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ideation" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Ideation
          </TabsTrigger>
          <TabsTrigger value="standard" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Standard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ideation" className="mt-4">
          <Card className="border-amber-500/40">
            <CardHeader className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
                <Lightbulb className="h-4 w-4" />
                Explore an idea
              </div>
              <CardTitle>Start with ideation</CardTitle>
              <CardDescription>
                Describe a rough idea. The ideation agent will help you explore, refine, and turn it into actionable requests.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleStartIdeation}>
              <CardContent className="space-y-3">
                <Textarea
                  value={ideaText}
                  onChange={(event) => setIdeaText(event.target.value)}
                  placeholder="e.g., I want to add a way for agents to communicate blockers back to humans..."
                  disabled={isSubmitting || !isConfigured || isProviderLoading}
                  rows={4}
                />
                {error && activeTab === "ideation" ? <p className="text-sm text-destructive">{error}</p> : null}
              </CardContent>
              <CardFooter className="flex items-center gap-2">
                <Button type="submit" disabled={isSubmitting || !isConfigured || isProviderLoading} className="bg-amber-600 hover:bg-amber-700">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    "Start ideation"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Uses the ideation workflow (3 stages).
                </p>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="standard" className="mt-4 space-y-6">
          <Card className="border-primary/40">
            <CardHeader className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Execute a request
              </div>
              <CardTitle>Start standard workflow</CardTitle>
              <CardDescription>
                Describe your intent or select an existing request to execute through the full workflow.
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
                {error && activeTab === "standard" ? <p className="text-sm text-destructive">{error}</p> : null}
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
                  Uses the standard workflow (8 stages).
                </p>
              </CardFooter>
            </form>
          </Card>

          <BacklogSelector
            onSelect={handleSelectRequest}
            disabled={isSubmitting || !isConfigured || isProviderLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
