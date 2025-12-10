// ADR: ADR-011-web-api-architecture
"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";
import { RankBadge } from "./rank-badge";

interface SortableItemProps {
  id: string;
  rank: number;
  children: React.ReactNode;
  disabled?: boolean;
}

/**
 * SortableItem wraps a child component with drag-and-drop functionality.
 */
function SortableItem({ id, rank, children, disabled }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-stretch gap-3 rounded-lg",
        isDragging && "opacity-50 z-50",
        !disabled && "group"
      )}
    >
      {/* Drag handle and rank badge */}
      <div className="flex items-center gap-2 py-2">
        {!disabled && (
          <button
            {...attributes}
            {...listeners}
            className={cn(
              "cursor-grab active:cursor-grabbing",
              "p-1 rounded hover:bg-accent",
              "text-muted-foreground hover:text-foreground",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
            )}
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-5 w-5" />
          </button>
        )}
        <RankBadge rank={rank} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

export interface SortableListItem {
  id: string;
  rank: number;
}

interface SortableListProps<T extends SortableListItem> {
  items: T[];
  onReorder: (requestId: string, newRank: number) => void;
  renderItem: (item: T) => React.ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * SortableList provides a drag-and-drop sortable list with rank badges.
 * Uses @dnd-kit for accessible drag-and-drop functionality.
 */
export function SortableList<T extends SortableListItem>({
  items,
  onReorder,
  renderItem,
  disabled = false,
  className,
}: SortableListProps<T>) {
  const [, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      // Calculate the new rank (1-indexed)
      const newRank = newIndex + 1;
      onReorder(active.id as string, newRank);
    }
  };

  // Sort items by rank for display
  const sortedItems = [...items].sort((a, b) => a.rank - b.rank);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => setActiveId(event.active.id as string)}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedItems.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={cn("space-y-2", className)}>
          {sortedItems.map((item) => (
            <SortableItem
              key={item.id}
              id={item.id}
              rank={item.rank}
              disabled={disabled}
            >
              {renderItem(item)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
