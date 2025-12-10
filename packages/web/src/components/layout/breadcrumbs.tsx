// ADR: ADR-011-web-api-architecture
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Custom label overrides for specific paths.
 * Key is the full path, value is the display label.
 */
const PATH_LABEL_OVERRIDES: Record<string, string> = {
  "/requests/new": "New Request",
};

function formatSegment(segment: string, fullPath: string): string {
  // Check for path-specific override
  if (PATH_LABEL_OVERRIDES[fullPath]) {
    return PATH_LABEL_OVERRIDES[fullPath];
  }

  // Convert kebab-case or snake_case to Title Case
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();

  // Don't show breadcrumbs on home page
  if (pathname === "/") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);

  // Build breadcrumb items with cumulative paths
  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = formatSegment(segment, href);
    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm">
      <ol className="flex items-center gap-1">
        <li>
          <Link
            href="/"
            className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {breadcrumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {crumb.isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className={cn(
                  "text-muted-foreground transition-colors hover:text-foreground"
                )}
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
