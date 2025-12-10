"use client";

// ADR: ADR-011-web-api-architecture

/**
 * RequestDetailClient - Client component for request detail page
 *
 * Fetches request content via tRPC and composes detail components.
 * Handles loading and error states.
 */

import { AlertCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";

import {
  RequestHeader,
  RequestHeaderSkeleton,
  RequestContent,
  RequestContentSkeleton,
  AcceptanceCriteriaList,
  AcceptanceCriteriaListSkeleton,
  LinkedChains,
  LinkedChainsSkeleton,
} from "@/components/requests";
import type { RequestType } from "@/components/requests";
import type { RequestStatus } from "@/components/requests";

interface RequestDetailClientProps {
  /** Request ID to fetch */
  id: string;
}

/**
 * RequestDetailClient fetches and displays full request details.
 */
export function RequestDetailClient({ id }: RequestDetailClientProps) {
  const { data, isLoading, error } = trpc.requests.getContent.useQuery(id);

  // Loading state
  if (isLoading) {
    return <RequestDetailSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <RequestHeaderSkeleton />
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">
                Failed to load request
              </p>
              <p className="text-sm text-muted-foreground">
                {error.message || "An unexpected error occurred."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No data (shouldn't happen if no error, but handle gracefully)
  if (!data) {
    return (
      <div className="space-y-6">
        <RequestHeaderSkeleton />
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground">Request not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { metadata, content } = data;

  return (
    <div className="space-y-6">
      {/* Request Header */}
      <RequestHeader
        id={metadata.id}
        title={metadata.title}
        type={metadata.type as RequestType}
        status={metadata.status as RequestStatus}
        domain={metadata.domain}
        created={metadata.created}
        owner={metadata.owner}
      />

      {/* Content Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <RequestContent content={content} />
        </CardContent>
      </Card>

      {/* Acceptance Criteria */}
      <Card>
        <CardHeader>
          <CardTitle>Acceptance Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <AcceptanceCriteriaList content={content} />
        </CardContent>
      </Card>

      {/* Linked Chains */}
      <Card>
        <CardHeader>
          <CardTitle>Linked Chains</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedChains requestId={metadata.id} />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Loading skeleton for the entire request detail view
 */
function RequestDetailSkeleton() {
  return (
    <div className="space-y-6">
      <RequestHeaderSkeleton />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <RequestContentSkeleton />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acceptance Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <AcceptanceCriteriaListSkeleton />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Linked Chains</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedChainsSkeleton />
        </CardContent>
      </Card>
    </div>
  );
}
