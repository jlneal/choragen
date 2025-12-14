// ADR: ADR-011-web-api-architecture

import type { ModelReference } from "@choragen/core";
import { Badge } from "@/components/ui/badge";

interface ModelBadgeProps {
  model?: ModelReference | null;
}

export function ModelBadge({ model }: ModelBadgeProps) {
  if (!model) return null;

  const label = `${model.provider}: ${model.model}`;
  return (
    <Badge variant="outline" className="text-[10px] font-medium leading-4">
      {label}
    </Badge>
  );
}
