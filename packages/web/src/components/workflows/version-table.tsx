// ADR: ADR-011-web-api-architecture
"use client";

import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface TemplateVersionRow {
  version: number;
  changedBy: string;
  changeDescription?: string;
  createdAt: Date;
  templateName: string;
}

function formatDate(date: Date): string {
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function VersionTable({ versions }: { versions: TemplateVersionRow[] }) {
  const router = useRouter();
  const latestVersion = versions.length > 0 ? Math.max(...versions.map((v) => v.version)) : null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Version</TableHead>
          <TableHead>Changed By</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {versions.map((version) => (
          <TableRow
            key={version.version}
            className="cursor-pointer"
            onClick={() =>
              router.push(`/workflows/${version.templateName}/versions/${version.version}`)
            }
          >
            <TableCell className="font-mono font-semibold">
              v{version.version}
            </TableCell>
            <TableCell className="flex items-center gap-2">
              <span>{version.changedBy}</span>
              {latestVersion === version.version && (
                <Badge variant="secondary">Latest</Badge>
              )}
            </TableCell>
            <TableCell className="max-w-xl truncate text-muted-foreground">
              {version.changeDescription || "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(version.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
