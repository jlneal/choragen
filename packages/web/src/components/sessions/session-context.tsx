// ADR: ADR-011-web-api-architecture

import Link from "next/link";
import { Link2, FileCode } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SessionContextProps {
  /** Chain ID this session is working on */
  chainId: string;
  /** Files/patterns the session has locked */
  files: string[];
}

/**
 * SessionContext displays the chain link and locked files for a session.
 */
export function SessionContext({ chainId, files }: SessionContextProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Context</CardTitle>
        <CardDescription>
          Chain and file locks for this session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chain Link */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Linked Chain
          </h4>
          <Link
            href={`/chains/${chainId}`}
            className="text-sm text-primary hover:underline font-mono"
          >
            {chainId}
          </Link>
        </div>

        {/* Locked Files */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Locked Files ({files.length})
          </h4>
          {files.length > 0 ? (
            <ul className="space-y-1">
              {files.map((file, index) => (
                <li
                  key={index}
                  className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded"
                >
                  {file}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No files locked for this session.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for SessionContext
 */
export function SessionContextSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <div className="space-y-1">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
