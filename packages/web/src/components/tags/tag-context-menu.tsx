// ADR: ADR-011-web-api-architecture
"use client";

import { useState } from "react";
import { FolderPlus, Loader2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CollisionDialog,
  type Collision,
  type CollisionStrategy,
  type ManualSelection,
} from "@/components/groups/collision-dialog";
import { trpc } from "@/lib/trpc/client";

interface TagContextMenuProps {
  /** The tag to show context menu for */
  tag: string;
  /** The trigger element (usually a TagBadge) */
  children: React.ReactNode;
  /** Callback when group is successfully created */
  onGroupCreated?: (groupId: string, groupName: string) => void;
}

/**
 * TagContextMenu provides a context menu for tag badges with
 * the option to create a group from the tag.
 */
export function TagContextMenu({
  tag,
  children,
  onGroupCreated,
}: TagContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCollisionDialog, setShowCollisionDialog] = useState(false);
  const [previewData, setPreviewData] = useState<{
    tag: string;
    requestIds: string[];
    collisions: Collision[];
  } | null>(null);

  const utils = trpc.useUtils();

  // Preview query - fetches on demand using utils.fetch
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handleCreateGroupFromTag = async () => {
    setIsOpen(false);
    setIsLoadingPreview(true);

    try {
      const data = await utils.groups.previewFromTag.fetch({ tag });
      setPreviewData(data);

      if (data.collisions.length > 0) {
        // Has collisions, show dialog
        setShowCollisionDialog(true);
      } else {
        // No collisions, create directly
        createFromTagMutation.mutate({
          tag: data.tag,
          collisionStrategy: "move-all",
        });
      }
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Create group mutation
  const createFromTagMutation = trpc.groups.createFromTag.useMutation({
    onSuccess: (result) => {
      // Invalidate queries to refresh data
      utils.groups.list.invalidate();
      utils.groups.getGroupForRequest.invalidate();

      setShowCollisionDialog(false);
      setPreviewData(null);

      if (onGroupCreated) {
        onGroupCreated(result.group.id, result.group.name);
      }
    },
  });


  const handleCollisionConfirm = (
    strategy: CollisionStrategy,
    manualSelections?: ManualSelection[]
  ) => {
    if (!previewData) return;

    createFromTagMutation.mutate({
      tag: previewData.tag,
      collisionStrategy: strategy,
      manualSelections,
    });
  };

  const handleCollisionClose = () => {
    setShowCollisionDialog(false);
    setPreviewData(null);
  };

  const isPending = isLoadingPreview || createFromTagMutation.isPending;

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={handleCreateGroupFromTag}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FolderPlus className="h-4 w-4 mr-2" />
            )}
            Create group from tag
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {previewData && (
        <CollisionDialog
          isOpen={showCollisionDialog}
          onClose={handleCollisionClose}
          tag={previewData.tag}
          totalRequests={previewData.requestIds.length}
          collisions={previewData.collisions}
          onConfirm={handleCollisionConfirm}
          isPending={createFromTagMutation.isPending}
        />
      )}
    </>
  );
}
