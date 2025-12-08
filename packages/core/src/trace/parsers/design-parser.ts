/**
 * Design document parser
 *
 * Extracts traceability links from design documentation:
 * - Linked ADRs section
 * - Linked Request section
 * - Implementation references
 *
 * @design-doc docs/design/core/features/trace-command.md
 * ADR: ADR-001-task-file-format (traceability patterns)
 */

import type { ArtifactReference } from "../types.js";
import {
  BaseLinkParser,
  type ParseContext,
  type ParseResult,
} from "./base-parser.js";
import {
  ADR_ID_PATTERN,
  REQUEST_ID_PATTERN,
  LINKED_ADRS_SECTION_PATTERN,
  LINKED_REQUEST_SECTION_PATTERN,
  MARKDOWN_LINK_PATTERN,
  freshPattern,
} from "./patterns.js";

/**
 * Parser for design documentation markdown files
 */
export class DesignParser extends BaseLinkParser {
  readonly supportedTypes = ["design" as const];
  readonly supportedExtensions = [".md"];

  /**
   * Check if this parser can handle the given file
   */
  override canParse(context: ParseContext): boolean {
    return (
      context.artifactType === "design" ||
      context.filePath.includes("/design/")
    );
  }

  parse(content: string, _context: ParseContext): ParseResult {
    const upstream: ArtifactReference[] = [];
    const downstream: ArtifactReference[] = [];

    // Extract Linked Request section (upstream - toward intent)
    upstream.push(...this.extractLinkedRequests(content));

    // Extract Linked ADRs section (downstream - decisions that implement this design)
    downstream.push(...this.extractLinkedAdrs(content));

    // Extract Implementation references (downstream - source files)
    downstream.push(...this.extractImplementationRefs(content));

    return { upstream, downstream };
  }

  /**
   * Extract Linked Request section
   */
  private extractLinkedRequests(content: string): ArtifactReference[] {
    const refs: ArtifactReference[] = [];
    const seen = new Set<string>();

    // Check for Linked Request section
    const sectionMatch = content.match(LINKED_REQUEST_SECTION_PATTERN);
    if (sectionMatch) {
      const section = sectionMatch[1];

      // Extract request IDs from the section
      const pattern = freshPattern(REQUEST_ID_PATTERN);
      let match;
      while ((match = pattern.exec(section)) !== null) {
        const requestId = match[0];
        if (!seen.has(requestId)) {
          seen.add(requestId);
          refs.push(this.createRequestReference(requestId));
        }
      }
    }

    // Also find request IDs anywhere in the document
    const pattern = freshPattern(REQUEST_ID_PATTERN);
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const requestId = match[0];
      if (!seen.has(requestId)) {
        seen.add(requestId);
        refs.push(this.createRequestReference(requestId));
      }
    }

    return refs;
  }

  /**
   * Extract Linked ADRs section
   */
  private extractLinkedAdrs(content: string): ArtifactReference[] {
    const refs: ArtifactReference[] = [];
    const seen = new Set<string>();

    // Check for Linked ADRs section
    const sectionMatch = content.match(LINKED_ADRS_SECTION_PATTERN);
    if (sectionMatch) {
      const section = sectionMatch[1];

      // Extract ADR IDs from the section
      const pattern = freshPattern(ADR_ID_PATTERN);
      let match;
      while ((match = pattern.exec(section)) !== null) {
        const adrId = match[0];
        if (!seen.has(adrId)) {
          seen.add(adrId);
          refs.push(this.createAdrReference(adrId));
        }
      }
    }

    // Also find ADR IDs anywhere in the document
    const pattern = freshPattern(ADR_ID_PATTERN);
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const adrId = match[0];
      if (!seen.has(adrId)) {
        seen.add(adrId);
        refs.push(this.createAdrReference(adrId));
      }
    }

    return refs;
  }

  /**
   * Extract Implementation references
   */
  private extractImplementationRefs(content: string): ArtifactReference[] {
    const refs: ArtifactReference[] = [];
    const seen = new Set<string>();

    // Look for Implementation section
    const implMatch = content.match(
      /##\s*Implementation\s*\n([\s\S]*?)(?=\n##\s|\n---|\z)/
    );
    if (implMatch) {
      const section = implMatch[1];

      // Extract markdown links to source files
      const linkPattern = freshPattern(MARKDOWN_LINK_PATTERN);
      let match;
      while ((match = linkPattern.exec(section)) !== null) {
        const linkPath = match[2];
        if (this.isSourcePath(linkPath) && !seen.has(linkPath)) {
          seen.add(linkPath);
          refs.push(this.createSourceReference(linkPath));
        }
      }

      // Also look for backtick-quoted paths
      const backtickPattern = /`(packages\/[^`]+\.(ts|js|tsx|jsx))`/g;
      while ((match = backtickPattern.exec(section)) !== null) {
        const filePath = match[1];
        if (!seen.has(filePath)) {
          seen.add(filePath);
          refs.push(this.createSourceReference(filePath));
        }
      }
    }

    return refs;
  }

  /**
   * Check if a path is a source file path
   */
  private isSourcePath(path: string): boolean {
    return (
      path.startsWith("packages/") &&
      (path.endsWith(".ts") ||
        path.endsWith(".js") ||
        path.endsWith(".tsx") ||
        path.endsWith(".jsx"))
    );
  }

  /**
   * Create a request reference
   */
  private createRequestReference(requestId: string): ArtifactReference {
    const type = requestId.startsWith("CR-")
      ? "change-requests"
      : "fix-requests";
    return this.createReference(
      "request",
      requestId,
      `docs/requests/${type}/done/${requestId}.md`
    );
  }

  /**
   * Create an ADR reference
   */
  private createAdrReference(adrId: string): ArtifactReference {
    return this.createReference("adr", adrId, `docs/adr/done/${adrId}.md`);
  }

  /**
   * Create a source file reference
   */
  private createSourceReference(filePath: string): ArtifactReference {
    const id = filePath.split("/").pop() ?? filePath;
    return this.createReference("source", id, filePath);
  }
}
