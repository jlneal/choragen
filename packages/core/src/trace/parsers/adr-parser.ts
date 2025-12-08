/**
 * ADR (Architecture Decision Record) parser
 *
 * Extracts traceability links from ADR markdown files:
 * - Linked CR/FR field
 * - Linked Design Docs field
 * - Implementation section (source file references)
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
  LINKED_CR_FR_PATTERN,
  LINKED_DESIGN_DOCS_PATTERN,
  IMPLEMENTATION_SECTION_PATTERN,
  REQUEST_ID_PATTERN,
  DESIGN_DOC_PATH_PATTERN,
  ADR_ID_PATTERN,
  MARKDOWN_LINK_PATTERN,
  freshPattern,
} from "./patterns.js";

/**
 * Parser for ADR markdown files
 */
export class AdrParser extends BaseLinkParser {
  readonly supportedTypes = ["adr" as const];
  readonly supportedExtensions = [".md"];

  /**
   * Check if this parser can handle the given file
   */
  override canParse(context: ParseContext): boolean {
    // Must be an ADR type or in the adr directory
    return (
      context.artifactType === "adr" || context.filePath.includes("/adr/")
    );
  }

  parse(content: string, context: ParseContext): ParseResult {
    const upstream: ArtifactReference[] = [];
    const downstream: ArtifactReference[] = [];

    // Extract Linked CR/FR (upstream - toward intent)
    upstream.push(...this.extractLinkedRequests(content));

    // Extract Linked Design Docs (upstream - toward intent)
    upstream.push(...this.extractLinkedDesignDocs(content));

    // Extract other ADR references (could be either direction)
    upstream.push(...this.extractAdrReferences(content, context));

    // Extract Implementation section (downstream - toward verification)
    downstream.push(...this.extractImplementationRefs(content));

    return { upstream, downstream };
  }

  /**
   * Extract Linked CR/FR field
   */
  private extractLinkedRequests(content: string): ArtifactReference[] {
    const refs: ArtifactReference[] = [];
    const seen = new Set<string>();

    // Check for explicit Linked CR/FR field
    const linkedMatch = content.match(LINKED_CR_FR_PATTERN);
    if (linkedMatch) {
      const requestId = linkedMatch[1];
      if (!seen.has(requestId)) {
        seen.add(requestId);
        refs.push(this.createRequestReference(requestId));
      }
    }

    // Also find any CR/FR IDs in the document
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
   * Extract Linked Design Docs field
   */
  private extractLinkedDesignDocs(content: string): ArtifactReference[] {
    const refs: ArtifactReference[] = [];
    const seen = new Set<string>();

    // Check for explicit Linked Design Docs field
    const linkedMatch = content.match(LINKED_DESIGN_DOCS_PATTERN);
    if (linkedMatch) {
      const docPath = linkedMatch[1];
      if (!seen.has(docPath)) {
        seen.add(docPath);
        refs.push(this.createDesignDocReference(docPath));
      }
    }

    // Also find design doc paths in markdown links
    const pattern = freshPattern(DESIGN_DOC_PATH_PATTERN);
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const docPath = match[0];
      if (!seen.has(docPath)) {
        seen.add(docPath);
        refs.push(this.createDesignDocReference(docPath));
      }
    }

    return refs;
  }

  /**
   * Extract references to other ADRs
   */
  private extractAdrReferences(
    content: string,
    context: ParseContext
  ): ArtifactReference[] {
    const refs: ArtifactReference[] = [];
    const seen = new Set<string>();

    // Get current ADR ID to avoid self-reference
    const currentAdrId = context.artifactId;

    const pattern = freshPattern(ADR_ID_PATTERN);
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const adrId = match[0];
      if (adrId !== currentAdrId && !seen.has(adrId)) {
        seen.add(adrId);
        refs.push(this.createAdrReference(adrId));
      }
    }

    return refs;
  }

  /**
   * Extract Implementation section references
   */
  private extractImplementationRefs(content: string): ArtifactReference[] {
    const refs: ArtifactReference[] = [];
    const seen = new Set<string>();

    // Find the Implementation section
    const sectionMatch = content.match(IMPLEMENTATION_SECTION_PATTERN);
    if (!sectionMatch) {
      return refs;
    }

    const section = sectionMatch[1];

    // Extract markdown links from the section
    const linkPattern = freshPattern(MARKDOWN_LINK_PATTERN);
    let match;
    while ((match = linkPattern.exec(section)) !== null) {
      const linkPath = match[2];

      // Only include source file references
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
   * Create a design doc reference
   */
  private createDesignDocReference(docPath: string): ArtifactReference {
    const id = docPath.split("/").pop()?.replace(".md", "") ?? docPath;
    return this.createReference("design", id, docPath);
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
