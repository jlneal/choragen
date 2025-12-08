/**
 * Base parser interface and abstract class for link parsers
 *
 * All artifact-specific parsers extend this base to provide consistent
 * link discovery across different file types.
 *
 * @design-doc docs/design/core/features/trace-command.md
 * ADR: ADR-001-task-file-format (traceability patterns)
 */

import type { ArtifactReference, ArtifactType } from "../types.js";

/**
 * Result of parsing a file for links
 */
export interface ParseResult {
  /** Links pointing upstream (toward intent) */
  upstream: ArtifactReference[];

  /** Links pointing downstream (toward verification) */
  downstream: ArtifactReference[];
}

/**
 * Context provided to parsers for link resolution
 */
export interface ParseContext {
  /** Project root directory */
  projectRoot: string;

  /** Path of the file being parsed (relative to project root) */
  filePath: string;

  /** Type of the artifact being parsed */
  artifactType: ArtifactType;

  /** Artifact ID if known */
  artifactId?: string;
}

/**
 * Interface for link parsers
 *
 * Each parser is responsible for extracting traceability links from
 * a specific type of artifact (source files, ADRs, design docs, etc.)
 */
export interface LinkParser {
  /**
   * Artifact types this parser can handle
   */
  readonly supportedTypes: ArtifactType[];

  /**
   * File extensions this parser can handle (e.g., ['.ts', '.js'])
   * If empty, the parser uses artifact type matching only
   */
  readonly supportedExtensions: string[];

  /**
   * Check if this parser can handle the given file
   */
  canParse(context: ParseContext): boolean;

  /**
   * Parse a file and extract traceability links
   *
   * @param content - File content to parse
   * @param context - Context about the file being parsed
   * @returns Discovered upstream and downstream links
   */
  parse(content: string, context: ParseContext): ParseResult;
}

/**
 * Abstract base class for link parsers
 *
 * Provides common functionality and enforces the parser interface.
 */
export abstract class BaseLinkParser implements LinkParser {
  abstract readonly supportedTypes: ArtifactType[];
  abstract readonly supportedExtensions: string[];

  /**
   * Check if this parser can handle the given file
   *
   * Default implementation checks artifact type and file extension.
   * Override for more specific matching logic.
   */
  canParse(context: ParseContext): boolean {
    // Check artifact type
    if (this.supportedTypes.includes(context.artifactType)) {
      return true;
    }

    // Check file extension
    if (this.supportedExtensions.length > 0) {
      const ext = this.getExtension(context.filePath);
      return this.supportedExtensions.includes(ext);
    }

    return false;
  }

  /**
   * Parse a file and extract traceability links
   */
  abstract parse(content: string, context: ParseContext): ParseResult;

  /**
   * Get file extension from path
   */
  protected getExtension(filePath: string): string {
    const lastDot = filePath.lastIndexOf(".");
    if (lastDot === -1) return "";
    return filePath.slice(lastDot);
  }

  /**
   * Create an empty parse result
   */
  protected emptyResult(): ParseResult {
    return { upstream: [], downstream: [] };
  }

  /**
   * Create an artifact reference
   */
  protected createReference(
    type: ArtifactType,
    id: string,
    path: string,
    title?: string
  ): ArtifactReference {
    return { type, id, path, title };
  }
}
