/**
 * Source file parser for .ts/.js files
 *
 * Extracts traceability links from TypeScript/JavaScript source files:
 * - ADR references in comments (// ADR: ADR-xxx)
 * - @design-doc JSDoc tags
 * - Import statements (for consumer discovery)
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
  ADR_COMMENT_PATTERN,
  ADR_ID_PATTERN,
  DESIGN_DOC_TAG_PATTERN,
  IMPORT_PATTERN,
  REQUIRE_PATTERN,
  DYNAMIC_IMPORT_PATTERN,
  REQUEST_ID_PATTERN,
  freshPattern,
} from "./patterns.js";

/**
 * Parser for TypeScript/JavaScript source files
 */
export class SourceParser extends BaseLinkParser {
  readonly supportedTypes = ["source" as const, "test" as const];
  readonly supportedExtensions = [".ts", ".js", ".tsx", ".jsx", ".mts", ".mjs"];

  parse(content: string, context: ParseContext): ParseResult {
    const upstream: ArtifactReference[] = [];
    const downstream: ArtifactReference[] = [];

    // Extract ADR references from comments
    upstream.push(...this.extractAdrReferences(content));

    // Extract @design-doc references
    upstream.push(...this.extractDesignDocReferences(content));

    // Extract CR/FR references
    upstream.push(...this.extractRequestReferences(content));

    // Extract imports for downstream consumer discovery
    // Note: These are stored as downstream because they represent
    // what this file depends on (consumers of the imported modules)
    const imports = this.extractImports(content, context);
    // Imports are actually upstream dependencies, not downstream
    // But we track them for bidirectional verification
    downstream.push(...imports);

    return { upstream, downstream };
  }

  /**
   * Extract ADR references from comments
   */
  private extractAdrReferences(content: string): ArtifactReference[] {
    const refs: ArtifactReference[] = [];
    const seen = new Set<string>();

    // Match ADR: comments
    const pattern = freshPattern(ADR_COMMENT_PATTERN);
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const adrId = match[1];
      if (!seen.has(adrId)) {
        seen.add(adrId);
        refs.push(this.createAdrReference(adrId));
      }
    }

    // Also check for bare ADR IDs in comments (without ADR: prefix)
    const idPattern = freshPattern(ADR_ID_PATTERN);
    while ((match = idPattern.exec(content)) !== null) {
      const adrId = match[0];
      if (!seen.has(adrId)) {
        seen.add(adrId);
        refs.push(this.createAdrReference(adrId));
      }
    }

    return refs;
  }

  /**
   * Extract @design-doc references
   */
  private extractDesignDocReferences(content: string): ArtifactReference[] {
    const refs: ArtifactReference[] = [];
    const seen = new Set<string>();

    const pattern = freshPattern(DESIGN_DOC_TAG_PATTERN);
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const docPath = match[1];
      if (!seen.has(docPath)) {
        seen.add(docPath);
        refs.push(this.createDesignDocReference(docPath));
      }
    }

    return refs;
  }

  /**
   * Extract CR/FR references from comments
   */
  private extractRequestReferences(content: string): ArtifactReference[] {
    const refs: ArtifactReference[] = [];
    const seen = new Set<string>();

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
   * Extract import statements
   */
  private extractImports(
    content: string,
    context: ParseContext
  ): ArtifactReference[] {
    const refs: ArtifactReference[] = [];
    const seen = new Set<string>();

    // ES imports
    const importPattern = freshPattern(IMPORT_PATTERN);
    let match;
    while ((match = importPattern.exec(content)) !== null) {
      const importPath = match[1];
      const resolved = this.resolveImportPath(importPath, context);
      if (resolved && !seen.has(resolved)) {
        seen.add(resolved);
        refs.push(this.createSourceReference(resolved));
      }
    }

    // CommonJS requires
    const requirePattern = freshPattern(REQUIRE_PATTERN);
    while ((match = requirePattern.exec(content)) !== null) {
      const importPath = match[1];
      const resolved = this.resolveImportPath(importPath, context);
      if (resolved && !seen.has(resolved)) {
        seen.add(resolved);
        refs.push(this.createSourceReference(resolved));
      }
    }

    // Dynamic imports
    const dynamicPattern = freshPattern(DYNAMIC_IMPORT_PATTERN);
    while ((match = dynamicPattern.exec(content)) !== null) {
      const importPath = match[1];
      const resolved = this.resolveImportPath(importPath, context);
      if (resolved && !seen.has(resolved)) {
        seen.add(resolved);
        refs.push(this.createSourceReference(resolved));
      }
    }

    return refs;
  }

  /**
   * Resolve an import path to a file path
   */
  private resolveImportPath(
    importPath: string,
    context: ParseContext
  ): string | null {
    // Skip external packages
    if (!importPath.startsWith(".") && !importPath.startsWith("/")) {
      return null;
    }

    // Skip node: protocol imports
    if (importPath.startsWith("node:")) {
      return null;
    }

    // Get the directory of the current file
    const currentDir = context.filePath.replace(/\/[^/]+$/, "");

    // Resolve relative path
    let resolved: string;
    if (importPath.startsWith("./")) {
      resolved = `${currentDir}/${importPath.slice(2)}`;
    } else if (importPath.startsWith("../")) {
      // Handle parent directory references
      const parts = currentDir.split("/");
      let upCount = 0;
      let remaining = importPath;
      while (remaining.startsWith("../")) {
        upCount++;
        remaining = remaining.slice(3);
      }
      parts.splice(-upCount);
      resolved = `${parts.join("/")}/${remaining}`;
    } else if (importPath.startsWith("/")) {
      resolved = importPath.slice(1);
    } else {
      return null;
    }

    // Add .ts extension if not present
    if (!resolved.match(/\.(ts|js|tsx|jsx|mts|mjs)$/)) {
      resolved = `${resolved}.ts`;
    }

    // Normalize path (remove .js -> .ts for ESM imports)
    resolved = resolved.replace(/\.js$/, ".ts");

    return resolved;
  }

  /**
   * Create an ADR reference
   */
  private createAdrReference(adrId: string): ArtifactReference {
    // ADR path will be resolved by the TraceEngine
    return this.createReference(
      "adr",
      adrId,
      `docs/adr/done/${adrId}.md` // Default path, will be resolved
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
   * Create a request reference
   */
  private createRequestReference(requestId: string): ArtifactReference {
    const type = requestId.startsWith("CR-")
      ? "change-requests"
      : "fix-requests";
    return this.createReference(
      "request",
      requestId,
      `docs/requests/${type}/done/${requestId}.md` // Default path
    );
  }

  /**
   * Create a source file reference
   */
  private createSourceReference(filePath: string): ArtifactReference {
    const id = filePath.split("/").pop() ?? filePath;
    return this.createReference("source", id, filePath);
  }
}
