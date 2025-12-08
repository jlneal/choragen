/**
 * Chain metadata parser
 *
 * Extracts traceability links from chain metadata files (JSON/YAML):
 * - Request ID (the CR/FR this chain implements)
 * - Task references
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
import { REQUEST_ID_PATTERN, TASK_ID_PATTERN, freshPattern } from "./patterns.js";

/**
 * Chain metadata structure
 */
interface ChainMetadata {
  id?: string;
  requestId?: string;
  tasks?: Array<{
    id?: string;
    status?: string;
  }>;
}

/**
 * Parser for chain metadata files
 */
export class ChainParser extends BaseLinkParser {
  readonly supportedTypes = ["chain" as const];
  readonly supportedExtensions = [".json", ".yaml", ".yml"];

  /**
   * Check if this parser can handle the given file
   */
  override canParse(context: ParseContext): boolean {
    return (
      context.artifactType === "chain" ||
      context.filePath.includes("/.chains/")
    );
  }

  parse(content: string, context: ParseContext): ParseResult {
    const upstream: ArtifactReference[] = [];
    const downstream: ArtifactReference[] = [];

    // Try to parse as JSON first
    let metadata: ChainMetadata | null = null;
    try {
      metadata = JSON.parse(content) as ChainMetadata;
    } catch {
      // Not JSON, try to extract from YAML-like content
      metadata = this.parseYamlLike(content);
    }

    if (metadata) {
      // Extract request ID (upstream - the intent this chain implements)
      if (metadata.requestId) {
        upstream.push(this.createRequestReference(metadata.requestId));
      }

      // Extract task references (downstream - tasks in this chain)
      if (metadata.tasks) {
        for (const task of metadata.tasks) {
          if (task.id) {
            downstream.push(this.createTaskReference(task.id, context));
          }
        }
      }
    }

    // Also scan content for any request IDs we might have missed
    upstream.push(...this.extractRequestIds(content, metadata?.requestId));

    // Scan for task IDs
    downstream.push(...this.extractTaskIds(content, context));

    return { upstream, downstream };
  }

  /**
   * Parse YAML-like content (simple key: value extraction)
   */
  private parseYamlLike(content: string): ChainMetadata | null {
    const metadata: ChainMetadata = {};

    // Extract requestId
    const requestMatch = content.match(/requestId:\s*["']?([^"'\n]+)["']?/);
    if (requestMatch) {
      metadata.requestId = requestMatch[1].trim();
    }

    // Extract id
    const idMatch = content.match(/^id:\s*["']?([^"'\n]+)["']?/m);
    if (idMatch) {
      metadata.id = idMatch[1].trim();
    }

    return metadata;
  }

  /**
   * Extract request IDs from content
   */
  private extractRequestIds(
    content: string,
    alreadyFound?: string
  ): ArtifactReference[] {
    const refs: ArtifactReference[] = [];
    const seen = new Set<string>();

    if (alreadyFound) {
      seen.add(alreadyFound);
    }

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
   * Extract task IDs from content
   */
  private extractTaskIds(
    content: string,
    context: ParseContext
  ): ArtifactReference[] {
    const refs: ArtifactReference[] = [];
    const seen = new Set<string>();

    const pattern = freshPattern(TASK_ID_PATTERN);
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const taskId = match[0];
      // Skip if it looks like a chain ID (CHAIN-NNN-slug)
      if (!taskId.startsWith("CHAIN-") && !seen.has(taskId)) {
        seen.add(taskId);
        refs.push(this.createTaskReference(taskId, context));
      }
    }

    return refs;
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
   * Create a task reference
   */
  private createTaskReference(
    taskId: string,
    context: ParseContext
  ): ArtifactReference {
    // Extract chain ID from context to build task path
    const chainId = context.artifactId ?? "unknown";
    return this.createReference(
      "task",
      taskId,
      `docs/tasks/todo/${chainId}/${taskId}.md`
    );
  }
}
