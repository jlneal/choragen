// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import type { WorkflowMessage } from "@choragen/core";
import { ArtifactLink } from "./artifact-link";

interface ArtifactListProps {
  messages?: WorkflowMessage[];
}

interface ArtifactInfo {
  artifactType: "cr" | "chain" | "task" | "file" | "adr";
  artifactId: string;
  title?: string;
}

function extractArtifacts(messages?: WorkflowMessage[]): ArtifactInfo[] {
  if (!messages) return [];
  const seen = new Set<string>();

  const artifacts: ArtifactInfo[] = [];
  for (const message of messages) {
    if (message.metadata?.type === "artifact") {
      const artifactType = message.metadata.artifactType;
      const artifactId = message.metadata.artifactId;
      if (
        (artifactType === "cr" ||
          artifactType === "chain" ||
          artifactType === "task" ||
          artifactType === "file" ||
          artifactType === "adr") &&
        typeof artifactId === "string"
      ) {
        const key = `${artifactType}-${artifactId}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        artifacts.push({
          artifactType,
          artifactId,
          title: typeof message.metadata.title === "string" ? message.metadata.title : undefined,
        });
      }
    }
  }

  return artifacts;
}

export function ArtifactList({ messages }: ArtifactListProps) {
  const artifacts = extractArtifacts(messages);

  if (artifacts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Artifact references will appear here as the workflow progresses.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {artifacts.map((artifact) => (
        <ArtifactLink
          key={`${artifact.artifactType}-${artifact.artifactId}`}
          artifactType={artifact.artifactType}
          artifactId={artifact.artifactId}
          title={artifact.title}
          defaultExpanded={false}
        />
      ))}
    </div>
  );
}
