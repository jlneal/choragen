// ADR: ADR-011-web-api-architecture
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Bug, Loader2 } from "lucide-react";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Request type options
 */
type RequestType = "cr" | "fr";

/**
 * Severity options for Fix Requests
 */
type Severity = "high" | "medium" | "low";

/**
 * Common domain values for the dropdown
 */
const COMMON_DOMAINS = [
  "core",
  "cli",
  "web",
  "contracts",
  "eslint-plugin",
  "docs",
  "infrastructure",
] as const;

/**
 * Form field error state
 */
interface FormErrors {
  title?: string;
  domain?: string;
}

/**
 * RequestForm component for creating new Change Requests or Fix Requests.
 *
 * Features:
 * - Type selector (CR/FR)
 * - Required fields: title, domain
 * - Optional fields: description, owner, severity (FR only), tags
 * - Domain dropdown with common values + custom input
 * - Form validation before submission
 * - Loading state during submission
 * - Redirects to new request on success
 */
export function RequestForm() {
  const router = useRouter();
  const utils = trpc.useUtils();

  // Form state
  const [type, setType] = useState<RequestType>("cr");
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [tags, setTags] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  // Create mutation
  const createMutation = trpc.requests.create.useMutation({
    onSuccess: (result) => {
      // Invalidate queries to refresh data
      utils.requests.list.invalidate();
      utils.requests.listChangeRequests.invalidate();
      utils.requests.listFixRequests.invalidate();

      // Redirect to the new request
      router.push(`/requests/${result.metadata.id}`);
    },
  });

  // Determine effective domain value
  const effectiveDomain = domain === "custom" ? customDomain : domain;

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!effectiveDomain.trim()) {
      newErrors.domain = "Domain is required";
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
      type,
      title: title.trim(),
      domain: effectiveDomain.trim(),
      description: description.trim() || undefined,
      owner: owner.trim() || undefined,
      severity: type === "fr" ? severity : undefined,
    });
  };

  const isPending = createMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Request</CardTitle>
        <CardDescription>
          Create a Change Request (CR) for new features or a Fix Request (FR) for bugs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Request Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="cr"
                  checked={type === "cr"}
                  onChange={() => setType("cr")}
                  disabled={isPending}
                  className="h-4 w-4"
                />
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Change Request</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="fr"
                  checked={type === "fr"}
                  onChange={() => setType("fr")}
                  disabled={isPending}
                  className="h-4 w-4"
                />
                <Bug className="h-4 w-4 text-red-600" />
                <span>Fix Request</span>
              </label>
            </div>
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
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder={type === "cr" ? "Add user authentication" : "Fix login redirect loop"}
              disabled={isPending}
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.title ? "border-red-500" : "border-input"
              } bg-background`}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Domain Field */}
          <div className="space-y-2">
            <label htmlFor="domain" className="text-sm font-medium">
              Domain <span className="text-red-500">*</span>
            </label>
            <select
              id="domain"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                if (errors.domain) setErrors((prev) => ({ ...prev, domain: undefined }));
              }}
              disabled={isPending}
              className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                errors.domain ? "border-red-500" : "border-input"
              } bg-background`}
            >
              <option value="">Select a domain...</option>
              {COMMON_DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              <option value="custom">Custom...</option>
            </select>
            {domain === "custom" && (
              <input
                type="text"
                value={customDomain}
                onChange={(e) => {
                  setCustomDomain(e.target.value);
                  if (errors.domain) setErrors((prev) => ({ ...prev, domain: undefined }));
                }}
                placeholder="Enter custom domain"
                disabled={isPending}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background mt-2"
              />
            )}
            {errors.domain && <p className="text-sm text-red-500">{errors.domain}</p>}
          </div>

          {/* Severity Field (FR only) */}
          {type === "fr" && (
            <div className="space-y-2">
              <label htmlFor="severity" className="text-sm font-medium">
                Severity
              </label>
              <select
                id="severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                disabled={isPending}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          )}

          {/* Description Field */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === "cr"
                  ? "Describe what you want to change or add..."
                  : "Describe the problem you encountered..."
              }
              disabled={isPending}
              rows={4}
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background resize-none"
            />
          </div>

          {/* Owner Field */}
          <div className="space-y-2">
            <label htmlFor="owner" className="text-sm font-medium">
              Owner
            </label>
            <input
              id="owner"
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="agent"
              disabled={isPending}
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to default to &quot;agent&quot;
            </p>
          </div>

          {/* Tags Field */}
          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-medium">
              Tags
            </label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              disabled={isPending}
              className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of tags (optional, can be added later)
            </p>
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
              onClick={() => router.push("/requests")}
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
                `Create ${type === "cr" ? "Change Request" : "Fix Request"}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
