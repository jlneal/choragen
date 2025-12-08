/**
 * Request (CR/FR) parser
 *
 * Extracts traceability links from Change Request and Fix Request markdown files:
 * - Design doc references
 * - ADR references
 * - Chain references
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
  DESIGN_DOC_PATH_PATTERN,
  ADR_ID_PATTERN,
  CHAIN_ID_PATTERN,
  MARKDOWN_LINK_PATTERN,
  freshPattern,
} from "./patterns.js";

/**
 * Parser for CR/FR markdown files
 */
export class RequestParser extends BaseLinkParser {
  readonly supportedTypes = ["request" as const];
  readonly supportedExtensions = [".md"];

  /**
   * Check if this parser can handle the given file
   */
  override canParse(context: ParseContext): boolean {
    return (
      context.artifactType === "request" ||
      context.filePath.includes("/change-requests/") ||
      context.filePath.includes("/fix-requests/")
    );
  }

  parse(content: string, _context: ParseContext): ParseResult {
    const upstream: ArtifactReference[] = [];
    const downstream: ArtifactReference[] = [];

    // Requests are at the top of the traceability chain
    // They don't have upstream links (they ARE the intent)

    // Extract design doc references (downstream - what implements this request)
    downstream.push(...this.extractDesignDocRefs(content));

    // Extract ADR references (downstream - decisions made for this request)
    downstream.push(...this.extractAdrRefs(content));

    // Extract chain references (downstream - work chains for this request)
    downstream.push(...this.extractChainRefs(content));

    return { upstream, downstream };
  }

  /**
   * Extract design doc references
   */
  private extractDesignDocRefs(content: string): ArtifactReference[] {
    const refs: ArtifactReference[] = [];
    const seen = new Set<string>();

    // Find design doc paths
    const pattern = freshPattern(DESIGN_DOC_PATH_PATTERN);
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const docPath = match[0];
      if (!seen.has(docPath)) {
        seen.add(docPath);
        refs.push(this.createDesignDocReference(docPath));
      }
    }

    // Also check markdown links
    const linkPattern = freshPattern(MARKDOWN_LINK_PATTERN);
    while ((match = linkPattern.exec(content)) !== null) {
      const linkPath = match[2];
      if (linkPath.includes("docs/design/") && !seen.has(linkPath)) {
        seen.add(linkPath);
        refs.push(this.createDesignDocReference(linkPath));
      }
    }

    return refs;
  }

  /**
   * Extract ADR references
   */
  private extractAdrRefs(content: string): ArtifactReference[] {
    const refs: ArtifactReference[] = [];
    const seen = new Set<string>();

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
   * Extract chain references
   */
  private extractChainRefs(content: string): ArtifactReference[] {
    const refs: ArtifactReference[] = [];
    const seen = new Set<string>();

    const pattern = freshPattern(CHAIN_ID_PATTERN);
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const chainId = match[0];
      if (!seen.has(chainId)) {
        seen.add(chainId);
        refs.push(this.createChainReference(chainId));
      }
    }

    return refs;
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
   * Create a chain reference
   */
  private createChainReference(chainId: string): ArtifactReference {
    return this.createReference(
      "chain",
      chainId,
      `docs/tasks/.chains/${chainId}.json`
    );
  }
}
