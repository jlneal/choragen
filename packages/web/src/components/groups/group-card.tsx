// ADR: ADR-011-web-api-architecture
"use client";

import { useState, useRef, useCallback } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { GroupHeader } from "./group-header";
import { RequestCard } from "@/components/requests/request-card";
import type { RequestStatus } from "@/components/requests/request-status-badge";
import type { RequestType } from "@/components/requests/request-type-badge";

/**
 * Request data structure
 */
interface RequestItem {
  id: string;
  type: RequestType;
  title: string;
  domain: string;
  status: RequestStatus;
  created: string;
  owner?: string;
  severity?: string;
  tags: string[];
}

interface GroupCardProps {
  /** Group ID */
  groupId: string;
  /** Group name */
  name: string;
  /** Requests in this group */
  requests: RequestItem[];
  /** Whether this is the first group (can't move up) */
  isFirst?: boolean;
  /** Whether this is the last group (can't move down) */
  isLast?: boolean;
  /** Callback to move the group */
  onMove: (delta: number) => void;
  /** Callback to rename the group */
  onRename: (newName: string) => void;
  /** Callback to delete the group */
  onDelete: () => void;
  /** Callback to remove a request from the group */
  onRemoveRequest: (requestId: string) => void;
  /** Callback when a tag is clicked */
  onTagClick?: (tag: string) => void;
  /** Whether an action is pending */
  isActionPending?: boolean;
  /** Additional class names */
  className?: string;
}

/** Long press duration in milliseconds */
const LONG_PRESS_DURATION_MS = 500;

/**
 * GroupCard displays a collapsible group of requests.
 * Supports long-press to remove requests from the group.
 */
export function GroupCard({
  groupId,
  name,
  requests,
  isFirst = false,
  isLast = false,
  onMove,
  onRename,
  onDelete,
  onRemoveRequest,
  onTagClick,
  isActionPending = false,
  className,
}: GroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [longPressRequestId, setLongPressRequestId] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLongPressStart = useCallback((requestId: string) => {
    longPressTimerRef.current = setTimeout(() => {
      setLongPressRequestId(requestId);
    }, LONG_PRESS_DURATION_MS);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleConfirmRemove = useCallback(
    (requestId: string) => {
      onRemoveRequest(requestId);
      setLongPressRequestId(null);
    },
    [onRemoveRequest]
  );

  const handleCancelRemove = useCallback(() => {
    setLongPressRequestId(null);
  }, []);

  return (
    <Card
      className={cn(
        "overflow-hidden border-purple-200 dark:border-purple-800",
        className
      )}
    >
      <GroupHeader
        groupId={groupId}
        name={name}
        requestCount={requests.length}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        onMoveUp={() => onMove(-1)}
        onMoveDown={() => onMove(1)}
        onRename={onRename}
        onDelete={onDelete}
        canMoveUp={!isFirst}
        canMoveDown={!isLast}
        isActionPending={isActionPending}
      />

      {isExpanded && (
        <CardContent className="p-3 space-y-2">
          {requests.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No requests in this group
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="relative"
                onMouseDown={() => handleLongPressStart(request.id)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={() => handleLongPressStart(request.id)}
                onTouchEnd={handleLongPressEnd}
              >
                {/* Remove confirmation overlay */}
                {longPressRequestId === request.id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-red-500/90 rounded-lg">
                    <div className="text-center text-white">
                      <p className="text-sm font-medium mb-2">
                        Remove from group?
                      </p>
                      <div className="flex gap-2 justify-center">
                        <button
                          className="px-3 py-1 text-sm bg-white text-red-600 rounded hover:bg-gray-100"
                          onClick={() => handleConfirmRemove(request.id)}
                        >
                          Remove
                        </button>
                        <button
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 border border-white"
                          onClick={handleCancelRemove}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <RequestCard
                  id={request.id}
                  title={request.title}
                  type={request.type}
                  domain={request.domain}
                  status={request.status}
                  created={request.created}
                  owner={request.owner}
                  severity={request.severity}
                  tags={request.tags}
                  onTagClick={onTagClick}
                  className={cn(
                    longPressRequestId === request.id && "opacity-0"
                  )}
                />
              </div>
            ))
          )}
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Skeleton loading state for GroupCard
 */
export function GroupCardSkeleton() {
  return (
    <Card className="overflow-hidden border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-t-lg border-b border-purple-100 dark:border-purple-900">
        <div className="h-6 w-6 bg-purple-200 dark:bg-purple-800 rounded animate-pulse" />
        <div className="h-4 w-4 bg-purple-200 dark:bg-purple-800 rounded animate-pulse" />
        <div className="flex-1 h-4 bg-purple-200 dark:bg-purple-800 rounded animate-pulse" />
        <div className="h-5 w-20 bg-purple-200 dark:bg-purple-800 rounded-full animate-pulse" />
      </div>
      <CardContent className="p-3 space-y-2">
        <div className="h-24 bg-muted rounded animate-pulse" />
        <div className="h-24 bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}
