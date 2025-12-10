// ADR: ADR-011-web-api-architecture
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText, Wrench } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Chain type options
 */
type ChainType = "design" | "implementation";

/**
 * Form field error state
 */
interface FormErrors {
  slug?: string;
  title?: string;
  requestId?: string;
}

interface ChainCreatorProps {
  /** Pre-filled request ID (from context) */
  defaultRequestId?: string;
  /** Callback when creation is cancelled */
  onCancel?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * ChainCreator component for creating new task chains.
 *
 * Features:
 * - Type selector (design/implementation)
 * - Required fields: slug, title, requestId
 * - Optional fields: description
 * - Request selector dropdown or pre-filled from context
 * - Form validation before submission
 * - Loading state during submission
 * - Redirects to new chain detail page on success
 * - Shows error message on failure
 */
export function ChainCreator({
  defaultRequestId,
  onCancel,
  className,
}: ChainCreatorProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  // Form state
  const [type, setType] = useState<ChainType>("implementation");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requestId, setRequestId] = useState(defaultRequestId ?? "");
  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch requests for the selector
  const { data: requests = [], isLoading: isLoadingRequests } =
    trpc.requests.list.useQuery();

  // Create mutation
  const createMutation = trpc.chains.create.useMutation({
    onSuccess: (result) => {
      // Invalidate queries to refresh data
      utils.chains.list.invalidate();

      // Redirect to the new chain
      router.push(`/chains/${result.id}`);
    },
  });

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!slug.trim()) {
      newErrors.slug = "Slug is required";
    } else if (!/^[a-z0-9-]+$/.test(slug.trim())) {
      newErrors.slug = "Slug must be lowercase letters, numbers, and hyphens only";
    }

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!requestId.trim()) {
      newErrors.requestId = "Request ID is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    createMutation.mutate({
      slug: slug.trim(),
      title: title.trim(),
      description: description.trim() || undefined,
      requestId: requestId.trim(),
      type,
    });
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/chains");
    }
  };

  const isPending = createMutation.isPending;

  // Filter out requests that are done (typically you'd create chains for active requests)
  const activeRequests = requests.filter((r) => r.status !== "done");

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Create New Chain</CardTitle>
        <CardDescription>
          Create a task chain to track implementation work for a request.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Chain Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="design"
                  checked={type === "design"}
                  onChange={() => setType("design")}
                  disabled={isPending}
                  className="h-4 w-4"
                />
                <FileText className="h-4 w-4 text-violet-600" />
                <span>Design</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="implementation"
                  checked={type === "implementation"}
                  onChange={() => setType("implementation")}
                  disabled={isPending}
                  className="h-4 w-4"
                />
                <Wrench className="h-4 w-4 text-cyan-600" />
                <span>Implementation</span>
              </label>
            </div>
          </div>

          {/* Request Selector */}
          <div className="space-y-2">
            <label htmlFor="requestId" className="text-sm font-medium">
              Request <span className="text-red-500">*</span>
            </label>
            {defaultRequestId ? (
              <input
                id="requestId"
                type="text"
                value={requestId}
                readOnly
                className="w-full rounded-md border border-input px-3 py-2 text-sm bg-muted cursor-not-allowed"
              />
            ) : (
              <select
                id="requestId"
                value={requestId}
                onChange={(e) => {
                  setRequestId(e.target.value);
                  if (errors.requestId)
                    setErrors((prev) => ({ ...prev, requestId: undefined }));
                }}
                disabled={isPending || isLoadingRequests}
                className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                  errors.requestId ? "border-red-500" : "border-input"
                } bg-background`}
              >
                <option value="">
                  {isLoadingRequests ? "Loading requests..." : "Select a request..."}
                </option>
                {activeRequests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} - {r.title}
                  </option>
                ))}
              </select>
            )}
            {errors.requestId && (
              <p className="text-sm text-red-500">{errors.requestId}</p>
            )}
          </div>

          {/* Slug Field */}
          <div className="space-y-2">
            <label htmlFor="slug" className="text-sm font-medium">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value.toLowerCase());
                if (errors.slug)
                  setErrors((prev) => ({ ...prev, slug: undefined }));
              }}
              placeholder="chain-management"
              disabled={isPending}
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.slug ? "border-red-500" : "border-input"
              } bg-background`}
            />
            {errors.slug && <p className="text-sm text-red-500">{errors.slug}</p>}
            <p className="text-xs text-muted-foreground">
              Used in the chain ID (e.g., CHAIN-054-chain-management)
            </p>
          </div>

          {/* Title Field */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title)
                  setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="Chain Management UI"
              disabled={isPending}
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.title ? "border-red-500" : "border-input"
              } bg-background`}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose and scope of this chain..."
              disabled={isPending}
              rows={3}
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background resize-none"
            />
          </div>

          {/* Error Message */}
          {createMutation.error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
              <p className="text-sm text-red-600 dark:text-red-400">
                {createMutation.error.message}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Chain"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
