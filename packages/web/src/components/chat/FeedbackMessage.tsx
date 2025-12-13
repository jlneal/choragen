// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useMemo, useState } from "react";

import type { FeedbackItem } from "@choragen/core";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  MessageSquare,
  XCircle,
} from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type FeedbackIconKey = "clarification" | "question" | "idea" | "blocker" | "review";

const typeStyles: Record<
  FeedbackIconKey,
  { icon: typeof HelpCircle; label: string; className: string }
> = {
  clarification: {
    icon: HelpCircle,
    label: "Clarification",
    className: "text-blue-600 bg-blue-50 border-blue-200",
  },
  question: {
    icon: MessageSquare,
    label: "Question",
    className: "text-indigo-600 bg-indigo-50 border-indigo-200",
  },
  idea: {
    icon: Lightbulb,
    label: "Idea",
    className: "text-amber-600 bg-amber-50 border-amber-200",
  },
  blocker: {
    icon: AlertTriangle,
    label: "Blocker",
    className: "text-red-600 bg-red-50 border-red-200",
  },
  review: {
    icon: CheckCircle2,
    label: "Review",
    className: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
};

const priorityClasses: Record<FeedbackItem["priority"], string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-50 text-amber-800 border border-amber-200",
  high: "bg-orange-100 text-orange-800 border border-orange-200",
  critical: "bg-red-100 text-red-800 border border-red-200",
};

export interface FeedbackMessageProps {
  feedback: FeedbackItem;
  workflowId?: string;
  defaultOpenResponse?: boolean;
}

export function FeedbackMessage({
  feedback,
  workflowId,
  defaultOpenResponse = false,
}: FeedbackMessageProps) {
  const utils = trpc.useUtils();
  const [responseText, setResponseText] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(defaultOpenResponse);

  const respond = trpc.feedback.respond.useMutation({
    onSuccess: async () => {
      await utils.feedback.list.invalidate();
      if (feedback.id) {
        await utils.feedback.get.invalidate({
          feedbackId: feedback.id,
          workflowId: workflowId ?? feedback.workflowId,
        });
      }
      setIsFormOpen(false);
      setResponseText("");
    },
  });

  const dismiss = trpc.feedback.dismiss.useMutation({
    onSuccess: async () => {
      await utils.feedback.list.invalidate();
      if (feedback.id) {
        await utils.feedback.get.invalidate({
          feedbackId: feedback.id,
          workflowId: workflowId ?? feedback.workflowId,
        });
      }
    },
  });

  const { icon: Icon, label, className } =
    typeStyles[feedback.type as FeedbackIconKey] ?? typeStyles.question;

  const priorityBadge = (
    <Badge className={cn("text-xs font-semibold", priorityClasses[feedback.priority])}>
      {feedback.priority}
    </Badge>
  );

  const isResolved = feedback.status === "resolved";
  const isDismissed = feedback.status === "dismissed";
  const isActionDisabled = isResolved || isDismissed;

  const files = feedback.context?.files ?? [];
  const codeSnippets = feedback.context?.codeSnippets ?? [];
  const options = feedback.context?.options ?? [];

  const responseContent = useMemo(() => {
    if (!feedback.response) return null;
    return (
      <div className="rounded-md border border-muted bg-muted/40 p-3">
        <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>Response from {feedback.response.respondedBy}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm">{feedback.response.content}</p>
        {feedback.response.selectedOption ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Selected option: <span className="font-semibold">{feedback.response.selectedOption}</span>
          </p>
        ) : null}
      </div>
    );
  }, [feedback.response]);

  const handleSubmit = async () => {
    const content = responseText.trim();
    if (!content) return;

    await respond.mutateAsync({
      feedbackId: feedback.id,
      workflowId: workflowId ?? feedback.workflowId,
      response: {
        content,
        selectedOption: selectedOption || undefined,
        respondedBy: "human",
      },
    });
  };

  const handleDismiss = async () => {
    await dismiss.mutateAsync({
      feedbackId: feedback.id,
      workflowId: workflowId ?? feedback.workflowId,
    });
  };

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-[720px] border-primary/40 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold",
                  className
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </span>
              {priorityBadge}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Stage {feedback.stageIndex + 1} • {feedback.type}
            </p>
          </div>
          {isResolved ? (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Resolved
            </Badge>
          ) : isDismissed ? (
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              Dismissed
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-sm text-foreground">{feedback.content}</p>

          {files.length ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Related files</p>
              <div className="flex flex-wrap gap-2">
                {files.map((file) => (
                  <a
                    key={file}
                    href={`/${file}`}
                    className="rounded-md border border-muted px-2 py-1 text-xs text-primary underline-offset-2 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {file}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {codeSnippets.length ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Code snippets</p>
              <div className="space-y-3">
                {codeSnippets.map((snippet, index) => (
                  <div
                    key={`${snippet.file}-${snippet.startLine}-${index}`}
                    className="rounded-md border border-muted bg-muted/40 p-3"
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium">{snippet.file}</span>
                      <span>
                        Lines {snippet.startLine}–{snippet.endLine}
                      </span>
                    </div>
                    <pre className="mt-2 overflow-auto rounded-md bg-background p-3 text-xs font-mono leading-relaxed">
                      <code>{snippet.content}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {options.length ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Options</p>
              <div className="space-y-2">
                {options.map((option) => (
                  <label
                    key={option.label}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm",
                      selectedOption === option.label
                        ? "border-primary bg-primary/5"
                        : "border-muted bg-muted/40"
                    )}
                  >
                    <input
                      type="radio"
                      name={`feedback-option-${feedback.id}`}
                      className="mt-1"
                      checked={selectedOption === option.label}
                      onChange={() => setSelectedOption(option.label)}
                      disabled={isActionDisabled}
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{option.label}</span>
                        {option.recommended ? (
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                            Recommended
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {responseContent}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t bg-muted/40 p-4">
          {!isActionDisabled ? (
            <>
              {isFormOpen ? (
                <div className="w-full space-y-3">
                  <Textarea
                    placeholder="Write a response..."
                    value={responseText}
                    onChange={(event) => setResponseText(event.target.value)}
                    disabled={respond.isPending}
                    className="min-h-[80px]"
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleSubmit} disabled={respond.isPending}>
                      {respond.isPending ? "Sending..." : "Send Response"}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setIsFormOpen(false)}
                      disabled={respond.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setIsFormOpen(true)}>
                      Respond
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDismiss}
                      disabled={dismiss.isPending}
                    >
                      {dismiss.isPending ? "Dismissing..." : "Dismiss"}
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(feedback.createdAt).toLocaleString()}
                  </div>
                </div>
              )}
              {respond.error ? (
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <XCircle className="h-4 w-4" />
                  <span>{respond.error.message}</span>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
              <span>
                {isResolved
                  ? "Feedback resolved — response recorded."
                  : "Feedback dismissed."}
              </span>
              <span>{new Date(feedback.updatedAt).toLocaleString()}</span>
            </div>
          )}
          <Separator />
          <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
            <span>Feedback ID: {feedback.id}</span>
            <span>Workflow: {workflowId ?? feedback.workflowId}</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
