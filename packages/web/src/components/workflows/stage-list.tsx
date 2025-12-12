// ADR: ADR-011-web-api-architecture
"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { StageEditor, type RoleOption, type ToolOption } from "./stage-editor";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc/client";
import {
  DEFAULT_STAGE,
  type TemplateStageInput,
} from "./template-form";

interface StageListProps {
  stages: TemplateStageInput[];
  editable?: boolean;
  onChange: (stages: TemplateStageInput[]) => void;
}

interface SortableStageProps {
  id: string;
  stage: TemplateStageInput;
  editable: boolean;
  displayIndex: number;
  roles: RoleOption[];
  toolsById: Map<string, ToolOption>;
  disableDelete: boolean;
  onChange: (stage: TemplateStageInput) => void;
  onDelete: () => void;
}

function SortableStage({
  id,
  stage,
  editable,
  displayIndex,
  roles,
  toolsById,
  disableDelete,
  onChange,
  onDelete,
}: SortableStageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <StageEditor
        stage={stage}
        index={displayIndex}
        editable={editable}
        roles={roles}
        toolsById={toolsById}
        disableDelete={disableDelete}
        onChange={onChange}
        onDelete={onDelete}
      />
    </div>
  );
}

export function StageList({ stages, editable = true, onChange }: StageListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [items, setItems] = useState<string[]>(() =>
    stages.map((_, index) => `stage-${index}`)
  );

  useEffect(() => {
    if (stages.length === items.length) return;
    setItems(stages.map((_, index) => items[index] ?? `stage-${index}`));
  }, [stages, items]);

  const {
    data: rolesData = [],
  } = trpc.roles.list.useQuery();
  const {
    data: toolsData = [],
  } = trpc.tools.list.useQuery();

  const roles = useMemo(
    () =>
      (rolesData as RoleOption[]).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    [rolesData]
  );

  const toolsById = useMemo(() => {
    const map = new Map<string, ToolOption>();
    (toolsData as ToolOption[]).forEach((tool) => map.set(tool.id, tool));
    return map;
  }, [toolsData]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.indexOf(active.id);
    const newIndex = items.indexOf(over.id);
    const reordered = arrayMove(stages, oldIndex, newIndex);
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);
    onChange(reordered);
  };

  const handleAddStage = () => {
    const newStage: TemplateStageInput = {
      ...DEFAULT_STAGE,
      name: `stage-${stages.length + 1}`,
    };
    onChange([...stages, newStage]);
    setItems((prev) => [...prev, `stage-${prev.length}`]);
  };

  const handleStageChange = (index: number, updated: TemplateStageInput) => {
    const next = [...stages];
    next[index] = updated;
    onChange(next);
  };

  const handleStageDelete = (index: number) => {
    if (stages.length <= 1) return;
    const next = stages.filter((_, idx) => idx !== index);
    const nextItems = items.filter((_, idx) => idx !== index);
    onChange(next);
    setItems(nextItems);
  };

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {stages.map((stage, index) => (
              <SortableStage
                key={items[index]}
                id={items[index]}
                stage={stage}
                editable={editable}
                displayIndex={index}
                roles={roles}
                toolsById={toolsById}
                disableDelete={!editable || stages.length <= 1}
                onChange={(updated) => handleStageChange(index, updated)}
                onDelete={() => handleStageDelete(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {editable && (
        <>
          <Separator />
          <Button variant="outline" onClick={handleAddStage} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Stage
          </Button>
        </>
      )}
    </div>
  );
}
