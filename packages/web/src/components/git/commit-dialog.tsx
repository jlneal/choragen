// ADR: ADR-011-web-api-architecture

"use client";

/**
 * CommitDialog Component
 *
 * Modal dialog for composing commit messages with:
 * - Commit type selector (feat, fix, docs, test, refactor, chore)
 * - Scope input field
 * - Description input field
 * - CR/FR selector dropdown (populated from active requests)
 * - Auto-generated commit message preview
 * - Submit triggers git.commit procedure
 */

import { useState, useMemo, useCallback } from "react";
import { Loader2, GitCommit, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Commit types following conventional commits
 */
const COMMIT_TYPES = [
  { value: "feat", label: "feat", description: "A new feature" },
  { value: "fix", label: "fix", description: "A bug fix" },
  { value: "docs", label: "docs", description: "Documentation changes" },
  { value: "test", label: "test", description: "Adding or updating tests" },
  { value: "refactor", label: "refactor", description: "Code refactoring" },
  { value: "chore", label: "chore", description: "Maintenance tasks" },
] as const;

type CommitType = (typeof COMMIT_TYPES)[number]["value"];

/**
 * Props for the CommitDialog component
 */
interface CommitDialogProps {
  /** Number of staged files (used to enable/disable commit) */
  stagedCount: number;
  /** Callback when commit succeeds */
  onCommitSuccess?: () => void;
  /** Custom trigger element */
  trigger?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * CommitDialog provides a modal for composing and submitting commits.
 * Auto-generates commit messages in the project format:
 * `<type>(<scope>): <description>\n\n[CR-xxx | FR-xxx]`
 */
export function CommitDialog({
  stagedCount,
  onCommitSuccess,
  trigger,
  className,
}: CommitDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [commitType, setCommitType] = useState<CommitType>("feat");
  const [scope, setScope] = useState("");
  const [description, setDescription] = useState("");
  const [requestId, setRequestId] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  const utils = trpc.useUtils();

  // Fetch active requests (todo + doing) for the CR/FR selector
  const { data: activeRequests, isLoading: isLoadingRequests } =
    trpc.requests.list.useQuery(
      { status: "doing" },
      {
        enabled: isOpen,
        staleTime: 30000,
      }
    );

  // Also fetch todo requests
  const { data: todoRequests } = trpc.requests.list.useQuery(
    { status: "todo" },
    {
      enabled: isOpen,
      staleTime: 30000,
    }
  );

  // Combine and sort requests
  const allActiveRequests = useMemo(() => {
    const doing = activeRequests ?? [];
    const todo = todoRequests ?? [];
    return [...doing, ...todo].sort((a, b) => b.created.localeCompare(a.created));
  }, [activeRequests, todoRequests]);

  const commitMutation = trpc.git.commit.useMutation({
    onSuccess: () => {
      utils.git.status.invalidate();
      utils.git.log.invalidate();
      resetForm();
      setIsOpen(false);
      onCommitSuccess?.();
    },
  });

  const resetForm = useCallback(() => {
    setCommitType("feat");
    setScope("");
    setDescription("");
    setRequestId("");
    setShowPreview(false);
  }, []);

  // Generate the commit message
  const commitMessage = useMemo(() => {
    if (!description.trim()) return "";

    const scopePart = scope.trim() ? `(${scope.trim()})` : "";
    const header = `${commitType}${scopePart}: ${description.trim()}`;

    return header;
  }, [commitType, scope, description]);

  // Full message with request ID
  const fullCommitMessage = useMemo(() => {
    if (!commitMessage) return "";
    if (!requestId) return commitMessage;
    return `${commitMessage}\n\n[${requestId}]`;
  }, [commitMessage, requestId]);

  const handleSubmit = useCallback(() => {
    if (!commitMessage.trim()) return;

    commitMutation.mutate({
      message: commitMessage,
      requestId: requestId || undefined,
    });
  }, [commitMessage, requestId, commitMutation]);

  const canSubmit =
    stagedCount > 0 && description.trim().length > 0 && !commitMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="default"
            size="sm"
            className={className}
            disabled={stagedCount === 0}
          >
            <GitCommit className="h-4 w-4 mr-2" />
            Commit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCommit className="h-5 w-5" />
            Commit Changes
          </DialogTitle>
          <DialogDescription>
            {stagedCount} file{stagedCount !== 1 ? "s" : ""} staged for commit
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Commit Type */}
          <div className="grid gap-2">
            <Label htmlFor="commit-type">Type</Label>
            <Select value={commitType} onValueChange={(v: string) => setCommitType(v as CommitType)}>
              <SelectTrigger id="commit-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {COMMIT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="font-mono">{type.label}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      — {type.description}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scope */}
          <div className="grid gap-2">
            <Label htmlFor="scope">
              Scope <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="scope"
              placeholder="e.g., git, dashboard, core"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the change"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* CR/FR Selector */}
          <div className="grid gap-2">
            <Label htmlFor="request-id">
              Request Reference{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Select value={requestId} onValueChange={setRequestId}>
              <SelectTrigger id="request-id">
                <SelectValue placeholder="Select CR/FR" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {isLoadingRequests ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : allActiveRequests.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No active requests
                  </div>
                ) : (
                  allActiveRequests.map((req) => (
                    <SelectItem key={req.id} value={req.id}>
                      <span className="font-mono text-xs">{req.id}</span>
                      <span className="text-muted-foreground ml-2 truncate">
                        {req.title}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Preview Toggle */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>
          </div>

          {/* Commit Message Preview */}
          {showPreview && fullCommitMessage && (
            <div className="rounded-md border bg-muted/50 p-3">
              <Label className="text-xs text-muted-foreground mb-2 block">
                Commit Message Preview
              </Label>
              <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                {fullCommitMessage}
              </pre>
            </div>
          )}

          {/* Error Display */}
          {commitMutation.isError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {commitMutation.error.message}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={commitMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {commitMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Committing...
              </>
            ) : (
              <>
                <GitCommit className="h-4 w-4 mr-2" />
                Commit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
