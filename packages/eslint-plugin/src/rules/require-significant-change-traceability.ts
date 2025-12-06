/**
 * Rule: require-significant-change-traceability
 *
 * Enforces that significant changes to tracked files include a @modified
 * annotation with CR/FR reference. This prevents incremental feature creep
 * without documentation.
 *
 * A change is considered "significant" if:
 * - The file has grown by more than the configured threshold (default: 100 lines)
 * - New exports are added to a module
 *
 * Valid:
 *   /**
 *    * @modified CR-20251206-001
 *    * Added new export functions for feature X
 *    *\/
 *
 * Invalid:
 *   (tracked file with 100+ new lines and no @modified annotation)
 *
 * ADR: ADR-002-governance-schema
 */

import type { Rule } from "eslint";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { dirname, join } from "path";

const CR_FR_PATTERN = /\b(CR|FR)-\d{8}-\d{3}\b/;
const MODIFIED_PATTERN = /@modified\s+(CR|FR)-\d{8}-\d{3}/;
const HEADER_SEARCH_LINE_LIMIT = 20;

// Default threshold for considering a change "significant"
const DEFAULT_LINE_THRESHOLD = 100;

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
 * Check if file is tracked in git
 */
function isFileTrackedInGit(filePath: string, projectRoot: string): boolean {
  try {
    const result = execSync(`git ls-files "${filePath}"`, {
      cwd: projectRoot,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return result.trim().length > 0;
  } catch {
    // If git command fails, assume file is tracked (fail open)
    return true;
  }
}

/**
 * Get the number of lines added to a file in the current working tree
 */
function getLinesAddedSinceLastCommit(
  filePath: string,
  projectRoot: string
): number {
  try {
    // Get diff stats for the file
    const result = execSync(
      `git diff --numstat HEAD -- "${filePath}" 2>/dev/null`,
      {
        cwd: projectRoot,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    if (!result.trim()) {
      return 0;
    }

    // Format: added\tremoved\tfilename
    const parts = result.trim().split("\t");
    const added = parseInt(parts[0], 10);
    return isNaN(added) ? 0 : added;
  } catch {
    return 0;
  }
}

/**
 * Check if file has new exports compared to last commit
 */
function hasNewExports(
  filePath: string,
  projectRoot: string,
  currentContent: string
): boolean {
  try {
    // Get the file content from HEAD
    const headContent = execSync(`git show HEAD:"${filePath}" 2>/dev/null`, {
      cwd: projectRoot,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Count export statements
    const exportPattern =
      /\bexport\s+(const|function|class|type|interface|enum|default)\b/g;
    const headExports = (headContent.match(exportPattern) || []).length;
    const currentExports = (currentContent.match(exportPattern) || []).length;

    return currentExports > headExports;
  } catch {
    return false;
  }
}

/**
 * Check if file has @modified annotation with CR/FR
 */
function hasModifiedAnnotation(
  sourceCode: ReturnType<Rule.RuleContext["getSourceCode"]>
): boolean {
  const lines = sourceCode.lines || sourceCode.getText().split("\n");
  const headerLines = lines.slice(0, HEADER_SEARCH_LINE_LIMIT).join("\n");
  return MODIFIED_PATTERN.test(headerLines);
}

/**
 * Check if file already has CR/FR in header (for new files)
 */
function hasCrFrInHeader(
  sourceCode: ReturnType<Rule.RuleContext["getSourceCode"]>
): boolean {
  const lines = sourceCode.lines || sourceCode.getText().split("\n");
  const headerLines = lines.slice(0, HEADER_SEARCH_LINE_LIMIT).join("\n");
  return CR_FR_PATTERN.test(headerLines);
}

/**
 * Simple glob pattern matching
 */
function matchPattern(pattern: string, filename: string): boolean {
  const regex = pattern
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*")
    .replace(/\./g, "\\.");
  return new RegExp(regex).test(filename);
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require @modified annotation with CR/FR for significant changes to tracked files",
      category: "Traceability",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          lineThreshold: {
            type: "integer",
            default: DEFAULT_LINE_THRESHOLD,
            description: "Number of lines added to trigger the rule",
          },
          filePatterns: {
            type: "array",
            items: { type: "string" },
            default: ["**/src/**", "**/lib/**", "**/app/**"],
            description: "File path patterns to check",
          },
          excludePatterns: {
            type: "array",
            items: { type: "string" },
            default: [
              "**/__tests__/**",
              "**/*.test.*",
              "**/*.spec.*",
              "**/index.ts",
              "**/types.ts",
            ],
            description: "Patterns to exclude from checking",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      significantChangeWithoutTraceability:
        "Significant change detected ({{reason}}). Add @modified annotation:\n" +
        "/**\n * @modified CR-YYYYMMDD-NNN or FR-YYYYMMDD-NNN\n * Description of changes\n */",
    },
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const options = context.options[0] || {};
    const lineThreshold: number = options.lineThreshold || DEFAULT_LINE_THRESHOLD;
    const filePatterns: string[] = options.filePatterns || [
      "**/src/**",
      "**/lib/**",
      "**/app/**",
    ];
    const excludePatterns: string[] = options.excludePatterns || [
      "**/__tests__/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/index.ts",
      "**/types.ts",
    ];

    // Check if file should be validated
    const shouldValidate =
      filePatterns.some((pattern) => matchPattern(pattern, filename)) &&
      !excludePatterns.some((pattern) => matchPattern(pattern, filename));

    if (!shouldValidate) {
      return {};
    }

    const projectRoot = findProjectRoot(dirname(filename));

    return {
      Program(node) {
        // Only check tracked files (untracked files are handled by require-new-file-traceability)
        if (!isFileTrackedInGit(filename, projectRoot)) {
          return;
        }

        const sourceCode = context.sourceCode || context.getSourceCode();
        const fullText = sourceCode.getText();

        // Skip if already has @modified or @cr/@fr annotation
        if (hasModifiedAnnotation(sourceCode) || hasCrFrInHeader(sourceCode)) {
          return;
        }

        // Check for significant changes
        const linesAdded = getLinesAddedSinceLastCommit(filename, projectRoot);
        const hasNewExportsFlag = hasNewExports(filename, projectRoot, fullText);

        let reason: string | null = null;

        if (linesAdded >= lineThreshold) {
          reason = `${linesAdded} lines added`;
        } else if (hasNewExportsFlag) {
          reason = "new exports added";
        }

        if (reason) {
          context.report({
            node,
            loc: { line: 1, column: 0 },
            messageId: "significantChangeWithoutTraceability",
            data: { reason },
          });
        }
      },
    };
  },
};

export default rule;
