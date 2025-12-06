/**
 * Rule: require-adr-relevance
 *
 * Validates that ADR references in source files are actually relevant
 * to the code, preventing agents from referencing arbitrary valid ADRs
 * to satisfy the require-adr-reference rule.
 *
 * Validates:
 * - ADR content mentions the file path or related patterns
 * - ADR governs the domain/layer the file belongs to
 * - ADR is not a generic/unrelated decision
 *
 * ADR: ADR-002-governance-schema (traceability requirements)
 */

import type { Rule } from "eslint";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const ADR_PATH_PATTERN = /docs\/adr\/[\w/-]+\.md/g;

// Minimum word length to be considered a keyword
const MIN_KEYWORD_LENGTH = 3;
// Minimum matches required for relevance
const MIN_KEYWORD_MATCHES = 2;
const MIN_DOMAIN_MATCHES = 2;
// Number of lines to search for ADR reference
const ADR_REFERENCE_LINE_LIMIT = 10;

/**
 * Find project root by walking up until package.json is found
 */
function findProjectRoot(startDir: string): string {
  let projectRoot = startDir;
  while (
    projectRoot !== "/" &&
    !existsSync(join(projectRoot, "package.json"))
  ) {
    projectRoot = dirname(projectRoot);
  }
  return projectRoot;
}

/**
 * Extract keywords from a file path for relevance matching
 */
function extractPathKeywords(filePath: string): Set<string> {
  const keywords = new Set<string>();

  // Extract directory names
  const parts = filePath.split("/");
  for (const part of parts) {
    if (part && !part.includes(".")) {
      // Convert camelCase/PascalCase to words
      const words = part
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .toLowerCase()
        .split(/[\s-_]+/);
      for (const word of words) {
        if (word.length >= MIN_KEYWORD_LENGTH) {
          keywords.add(word);
        }
      }
    }
  }

  // Extract filename without extension
  const filename = basename(filePath).replace(/\.[^.]+$/, "");
  const filenameWords = filename
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[\s-_]+/);
  for (const word of filenameWords) {
    if (word.length >= MIN_KEYWORD_LENGTH) {
      keywords.add(word);
    }
  }

  return keywords;
}

/**
 * Determine the domain/layer of a file
 */
function getFileDomain(filePath: string): string[] {
  const domains: string[] = [];

  if (filePath.includes("/app/api/")) domains.push("api", "route", "endpoint");
  if (filePath.includes("/lib/")) domains.push("lib", "library", "utility");
  if (filePath.includes("/components/"))
    domains.push("component", "ui", "react");
  if (filePath.includes("/src/")) domains.push("source", "implementation");
  if (filePath.includes("/packages/")) domains.push("package", "module");
  if (filePath.includes("/rules/")) domains.push("rule", "eslint", "lint");
  if (filePath.includes("/templates/")) domains.push("template", "generator");
  if (filePath.includes("/scripts/")) domains.push("script", "automation");
  if (filePath.includes("/auth")) domains.push("auth", "authentication");
  if (filePath.includes("/governance"))
    domains.push("governance", "traceability");

  return domains;
}

interface RelevanceResult {
  relevant: boolean;
  reason: string;
  keywordMatches?: number;
  domainMatches?: number;
}

/**
 * Check if ADR content is relevant to the file
 */
function isAdrRelevant(
  adrPath: string,
  filePath: string,
  projectRoot: string
): RelevanceResult {
  const fullAdrPath = join(projectRoot, adrPath);

  if (!existsSync(fullAdrPath)) {
    return { relevant: false, reason: "not_found" };
  }

  try {
    const adrContent = readFileSync(fullAdrPath, "utf-8").toLowerCase();
    const pathKeywords = extractPathKeywords(filePath);
    const fileDomains = getFileDomain(filePath);

    // Check if ADR mentions the file path directly
    const relativePath = filePath.replace(projectRoot, "").replace(/^\//, "");
    if (adrContent.includes(relativePath.toLowerCase())) {
      return { relevant: true, reason: "direct_mention" };
    }

    // Check if ADR mentions the filename
    const filename = basename(filePath).toLowerCase();
    if (adrContent.includes(filename)) {
      return { relevant: true, reason: "filename_mention" };
    }

    // Check keyword overlap (need at least MIN_KEYWORD_MATCHES matching keywords)
    let keywordMatches = 0;
    for (const keyword of pathKeywords) {
      if (adrContent.includes(keyword)) {
        keywordMatches++;
      }
    }
    if (keywordMatches >= MIN_KEYWORD_MATCHES) {
      return { relevant: true, reason: "keyword_match" };
    }

    // Check domain overlap
    let domainMatches = 0;
    for (const domain of fileDomains) {
      if (adrContent.includes(domain)) {
        domainMatches++;
      }
    }
    if (domainMatches >= MIN_DOMAIN_MATCHES) {
      return { relevant: true, reason: "domain_match" };
    }

    // Check for generic ADRs that apply broadly
    const genericPatterns = [
      "all source files",
      "all api routes",
      "all components",
      "entire codebase",
      "project-wide",
      "cross-cutting",
    ];
    for (const pattern of genericPatterns) {
      if (adrContent.includes(pattern)) {
        return { relevant: true, reason: "generic_adr" };
      }
    }

    return {
      relevant: false,
      reason: "no_relevance",
      keywordMatches,
      domainMatches,
    };
  } catch {
    return { relevant: false, reason: "read_error" };
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Validate that ADR references are relevant to the source file",
      category: "Traceability",
      recommended: false,
    },
    messages: {
      irrelevantAdr:
        "ADR '{{adrPath}}' may not be relevant to this file. " +
        "ADR content should mention the file, its domain, or related concepts. " +
        "Consider referencing a more specific ADR or updating the ADR to include this file.",
      noRelevanceFound:
        "ADR '{{adrPath}}' has no apparent connection to '{{filePath}}'. " +
        "Found {{keywordMatches}} keyword matches and {{domainMatches}} domain matches (need 2+). " +
        "Reference an ADR that governs this code's architecture.",
    },
    schema: [
      {
        type: "object",
        properties: {
          minKeywordMatches: {
            type: "integer",
            default: 2,
            description: "Minimum keyword matches required for relevance",
          },
          minDomainMatches: {
            type: "integer",
            default: 2,
            description: "Minimum domain matches required for relevance",
          },
          excludePatterns: {
            type: "array",
            items: { type: "string" },
            description: "Patterns for files to exclude from this rule",
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const options = context.options[0] || {};
    const excludePatterns = options.excludePatterns || [
      "**/__tests__/**",
      "**/test/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/index.ts",
      "**/*.d.ts",
      "**/types.ts",
    ];

    // Check if file is excluded
    for (const pattern of excludePatterns) {
      if (matchPattern(pattern, filename)) {
        return {};
      }
    }

    // Only validate source files
    const isSourceFile =
      filename.endsWith(".ts") || filename.endsWith(".tsx") ||
      filename.endsWith(".js") || filename.endsWith(".mjs");

    if (!isSourceFile) {
      return {};
    }

    const projectRoot = findProjectRoot(dirname(filename));

    return {
      Program(node) {
        const sourceCode = context.sourceCode || context.getSourceCode();

        // Look for ADR reference in the first few lines
        const headerLines = sourceCode.lines
          .slice(0, ADR_REFERENCE_LINE_LIMIT)
          .join("\n");

        const adrMatches = headerLines.match(ADR_PATH_PATTERN);
        if (!adrMatches) {
          return; // No ADR references to validate
        }

        for (const adrPath of adrMatches) {
          const relevance = isAdrRelevant(adrPath, filename, projectRoot);

          if (!relevance.relevant && relevance.reason === "no_relevance") {
            context.report({
              node,
              loc: { line: 1, column: 0 },
              messageId: "noRelevanceFound",
              data: {
                adrPath,
                filePath: basename(filename),
                keywordMatches: String(relevance.keywordMatches || 0),
                domainMatches: String(relevance.domainMatches || 0),
              },
            });
          }
        }
      },
    };
  },
};

function matchPattern(pattern: string, filename: string): boolean {
  // Simple glob matching - escape dots BEFORE replacing globs
  const regex = pattern
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*");
  return new RegExp(regex).test(filename);
}

export default rule;
