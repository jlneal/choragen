// ADR: ADR-011-web-api-architecture

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SessionsTableSkeletonProps {
  /** Number of skeleton rows to display */
  rows?: number;
  /** Additional class names */
  className?: string;
}

const DEFAULT_ROW_COUNT = 5;

/**
 * SessionsTableSkeleton provides a loading state for SessionsTable.
 * Matches the dimensions and layout of the actual table.
 *
 * @example
 * ```tsx
 * {isLoading ? (
 *   <SessionsTableSkeleton rows={5} />
 * ) : (
 *   <SessionsTable sessions={sessions} />
 * )}
 * ```
 */
export function SessionsTableSkeleton({
  rows = DEFAULT_ROW_COUNT,
  className,
}: SessionsTableSkeletonProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        {/* Title skeleton */}
        <Skeleton className="h-5 w-24" />
        {/* Description skeleton */}
        <Skeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-6 px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead className="text-right">
                  <Skeleton className="h-4 w-12 ml-auto" />
                </TableHead>
                <TableHead className="text-right">
                  <Skeleton className="h-4 w-10 ml-auto" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-14" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-16" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: rows }).map((_, index) => (
                <TableRow key={index}>
                  {/* Session ID */}
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  {/* Tokens */}
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                  {/* Cost */}
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-14 ml-auto" />
                  </TableCell>
                  {/* Status badge */}
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-md" />
                  </TableCell>
                  {/* Date */}
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
