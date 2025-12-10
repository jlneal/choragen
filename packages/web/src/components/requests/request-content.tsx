// ADR: ADR-011-web-api-architecture

/**
 * RequestContent - Displays parsed markdown sections from request content
 *
 * Extracts and displays Summary, Motivation, and Scope sections
 * from the raw markdown content.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ContentSection {
  /** Section heading */
  heading: string;
  /** Section content (text after heading) */
  content: string;
}

interface RequestContentProps {
  /** Raw markdown content */
  content: string;
  /** Sections to extract (defaults to Summary, Motivation, Scope) */
  sections?: string[];
  /** Additional class names */
  className?: string;
}

/**
 * Extract sections from markdown content by heading
 * Splits on ## headings and extracts content until the next heading
 */
function extractSections(
  content: string,
  targetSections: string[]
): ContentSection[] {
  const sections: ContentSection[] = [];
  const targetLower = targetSections.map((s) => s.toLowerCase());

  // Split content by ## headings
  const headingPattern = /^## (.+)$/gm;
  const parts: { heading: string; startIndex: number }[] = [];

  let match;
  while ((match = headingPattern.exec(content)) !== null) {
    parts.push({
      heading: match[1].trim(),
      startIndex: match.index + match[0].length,
    });
  }

  // Extract content for each matching section
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const headingLower = part.heading.toLowerCase();

    if (targetLower.includes(headingLower)) {
      // Find the end of this section (start of next heading or end of content)
      const endIndex = parts[i + 1]?.startIndex
        ? content.lastIndexOf("\n##", parts[i + 1].startIndex)
        : content.length;

      const sectionContent = content
        .slice(part.startIndex, endIndex)
        .trim()
        // Remove leading/trailing whitespace and normalize line breaks
        .replace(/^\n+/, "")
        .replace(/\n+$/, "");

      if (sectionContent) {
        sections.push({
          heading: part.heading,
          content: sectionContent,
        });
      }
    }
  }

  return sections;
}

/**
 * Default sections to extract from request content
 */
const DEFAULT_SECTIONS = ["Summary", "Motivation", "Scope"];

/**
 * RequestContent extracts and displays markdown sections from request content.
 * Focuses on Summary, Motivation, and Scope sections by default.
 */
export function RequestContent({
  content,
  sections = DEFAULT_SECTIONS,
  className,
}: RequestContentProps) {
  const extractedSections = extractSections(content, sections);

  if (extractedSections.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        No content sections found.
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {extractedSections.map((section, index) => (
        <div key={index} className="space-y-2">
          <h3 className="text-sm font-medium">{section.heading}</h3>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {section.content}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for RequestContent
 */
export function RequestContentSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
