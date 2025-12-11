// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md
"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { ArtifactIcon } from "./artifact-icon";
import { ArtifactPreview } from "./artifact-preview";

export type ArtifactType = "cr" | "chain" | "task" | "file" | "adr";

export interface ArtifactLinkProps {
  artifactType: ArtifactType;
  artifactId: string;
  title?: string;
  defaultExpanded?: boolean;
}

function buildHref(type: ArtifactType, id: string): string {
  switch (type) {
    case "cr":
      return `/requests/${id}`;
    case "chain":
      return `/chains/${id}`;
    case "task":
      return `/tasks/${id}`;
    case "file":
      return "/git";
    case "adr":
      return `/docs/adr/${id}`;
    default:
      return "#";
  }
}

export function ArtifactLink({
  artifactType,
  artifactId,
  title,
  defaultExpanded = false,
}: ArtifactLinkProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const href = buildHref(artifactType, artifactId);

  return (
    <Card className="border-primary/70">
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between space-y-0",
          "cursor-pointer"
        )}
        onClick={() => setExpanded((current) => !current)}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-3">
          <ArtifactIcon type={artifactType} />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{artifactId}</span>
              <Link
                href={href}
                className="text-primary text-xs underline decoration-dotted underline-offset-4"
                onClick={(event) => event.stopPropagation()}
              >
                Open
              </Link>
            </div>
            {title ? <span className="text-sm text-muted-foreground">{title}</span> : null}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            expanded ? "rotate-180" : ""
          )}
        />
      </CardHeader>
      {expanded ? (
        <CardContent>
          <ArtifactPreview artifactType={artifactType} artifactId={artifactId} title={title} />
        </CardContent>
      ) : null}
    </Card>
  );
}
