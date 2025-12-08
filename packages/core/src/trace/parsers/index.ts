/**
 * Parser registry and factory for link parsers
 *
 * Provides a unified interface for selecting and using the appropriate
 * parser for each artifact type.
 *
 * @design-doc docs/design/core/features/trace-command.md
 * ADR: ADR-001-task-file-format (traceability patterns)
 */

import type { ArtifactType } from "../types.js";
import type {
  LinkParser,
  ParseContext,
  ParseResult,
} from "./base-parser.js";
import { SourceParser } from "./source-parser.js";
import { AdrParser } from "./adr-parser.js";
import { RequestParser } from "./request-parser.js";
import { DesignParser } from "./design-parser.js";
import { ChainParser } from "./chain-parser.js";

// Re-export types and base classes
export type { LinkParser, ParseContext, ParseResult } from "./base-parser.js";
export { BaseLinkParser } from "./base-parser.js";

// Re-export individual parsers
export { SourceParser } from "./source-parser.js";
export { AdrParser } from "./adr-parser.js";
export { RequestParser } from "./request-parser.js";
export { DesignParser } from "./design-parser.js";
export { ChainParser } from "./chain-parser.js";

// Re-export patterns
export * from "./patterns.js";

/**
 * Parser registry that manages all available link parsers
 */
export class ParserRegistry {
  private parsers: LinkParser[] = [];

  constructor() {
    // Register default parsers
    this.register(new SourceParser());
    this.register(new AdrParser());
    this.register(new RequestParser());
    this.register(new DesignParser());
    this.register(new ChainParser());
  }

  /**
   * Register a parser
   */
  register(parser: LinkParser): void {
    this.parsers.push(parser);
  }

  /**
   * Get a parser that can handle the given context
   */
  getParser(context: ParseContext): LinkParser | null {
    for (const parser of this.parsers) {
      if (parser.canParse(context)) {
        return parser;
      }
    }
    return null;
  }

  /**
   * Get all parsers that can handle the given artifact type
   */
  getParsersForType(type: ArtifactType): LinkParser[] {
    return this.parsers.filter((p) => p.supportedTypes.includes(type));
  }

  /**
   * Parse content using the appropriate parser
   */
  parse(content: string, context: ParseContext): ParseResult {
    const parser = this.getParser(context);
    if (!parser) {
      return { upstream: [], downstream: [] };
    }
    return parser.parse(content, context);
  }

  /**
   * Get all registered parsers
   */
  getAllParsers(): LinkParser[] {
    return [...this.parsers];
  }
}

/**
 * Default parser registry instance
 */
let defaultRegistry: ParserRegistry | null = null;

/**
 * Get the default parser registry
 */
export function getParserRegistry(): ParserRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new ParserRegistry();
  }
  return defaultRegistry;
}

/**
 * Create a new parser registry
 */
export function createParserRegistry(): ParserRegistry {
  return new ParserRegistry();
}

/**
 * Convenience function to parse content
 */
export function parseLinks(content: string, context: ParseContext): ParseResult {
  return getParserRegistry().parse(content, context);
}

/**
 * Infer artifact type from file path
 */
export function inferArtifactType(filePath: string): ArtifactType {
  if (
    filePath.includes("/change-requests/") ||
    filePath.includes("/fix-requests/")
  ) {
    return "request";
  }
  if (filePath.includes("/adr/")) {
    return "adr";
  }
  if (filePath.includes("/design/")) {
    return "design";
  }
  if (filePath.includes("/.chains/")) {
    return "chain";
  }
  if (filePath.includes("/tasks/") && !filePath.includes("/.chains/")) {
    return "task";
  }
  if (
    filePath.includes("__tests__") ||
    filePath.includes(".test.") ||
    filePath.includes(".spec.")
  ) {
    return "test";
  }
  if (filePath.includes("/src/") || filePath.includes("/packages/")) {
    return "source";
  }
  return "external";
}

/**
 * Create a parse context from a file path
 */
export function createParseContext(
  filePath: string,
  projectRoot: string,
  artifactId?: string
): ParseContext {
  return {
    projectRoot,
    filePath,
    artifactType: inferArtifactType(filePath),
    artifactId,
  };
}
