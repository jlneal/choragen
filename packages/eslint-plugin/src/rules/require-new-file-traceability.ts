/**
 * Rule: require-new-file-traceability
 *
 * Enforces that new (untracked) source files include a CR/FR reference
 * in their header comment. This prevents agents from creating files
 * without proper request traceability.
 *
 * Valid:
 *   /**
 *    * @cr CR-20251206-001
 *    * Description of why this file was created
 *    *\/
 *
 * Invalid:
 *   (new file with no CR/FR reference in header)
 *
 * ADR: ADR-002-governance-schema
 */

import type { Rule } from "eslint";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { dirname, join } from "path";

const CR_FR_PATTERN = /\b(CR|FR)-\d{8}-\d{3}\b/;
const HEADER_SEARCH_LINE_LIMIT = 15;

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
    // git ls-files returns the file path if tracked, empty if not
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
 * Check if file has CR/FR reference in header
 */
function hasCrFrInHeader(sourceCode: ReturnType<Rule.RuleContext["getSourceCode"]>): boolean {
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
        "Require CR/FR reference in header for new (untracked) source files",
      category: "Traceability",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
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
      missingCrFrForNewFile:
        "New file must include CR/FR reference in header comment. Add:\n" +
        "/**\n * @cr CR-YYYYMMDD-NNN or @fr FR-YYYYMMDD-NNN\n * Description of why this file was created\n */",
    },
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const options = context.options[0] || {};
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
        // Check if file is tracked in git
        if (isFileTrackedInGit(filename, projectRoot)) {
          // File is already tracked, no need to require CR/FR
          return;
        }

        // File is new (untracked), check for CR/FR reference
        const sourceCode = context.sourceCode || context.getSourceCode();

        if (!hasCrFrInHeader(sourceCode)) {
          context.report({
            node,
            loc: { line: 1, column: 0 },
            messageId: "missingCrFrForNewFile",
          });
        }
      },
    };
  },
};

export default rule;
