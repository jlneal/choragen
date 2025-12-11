// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md

import { FileText, GitBranch, ListTodo, File, Landmark, type LucideIcon } from "lucide-react";

type ArtifactType = "cr" | "chain" | "task" | "file" | "adr";

const ICONS: Record<ArtifactType, LucideIcon> = {
  cr: FileText,
  chain: GitBranch,
  task: ListTodo,
  file: File,
  adr: Landmark,
};

export function ArtifactIcon({ type, className }: { type: ArtifactType; className?: string }) {
  const Icon = ICONS[type];
  return <Icon className={className ?? "h-4 w-4 text-muted-foreground"} data-type={type} />;
}
