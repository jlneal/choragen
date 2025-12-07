/**
 * Rule: require-cr-fr-exists
 *
 * Validates that CR/FR references in comments actually exist as files
 * in docs/requests/.
 *
 * Prevents agents from using fake CR/FR IDs to bypass justification requirements.
 *
 * ADR: ADR-002-governance-schema
 */

import type { Rule } from "eslint";
import { existsSync, readdirSync } from "fs";
import { dirname, join } from "path";

const CR_FR_PATTERN = /\b(CR|FR)-(\d{8})-(\d{3})\b/g;

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
 * Check if a CR/FR request file exists (synchronous)
 */
function requestFileExistsSync(projectRoot: string, requestId: string): boolean {
  const requestType = requestId.startsWith("CR") ? "change" : "fix";
  const baseDir = join(
    projectRoot,
    "docs/requests",
    `${requestType}-requests`,
  );

  // Check all status directories
  const statusDirs = ["todo", "doing", "done"];
  for (const status of statusDirs) {
    const dirPath = join(baseDir, status);
    try {
      const files = readdirSync(dirPath);
      if (files.some((f) => f.startsWith(requestId))) {
        return true;
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
  }

  // Also check archive directories (YYYY/MM structure)
  const archiveDir = join(baseDir, "archive");
  try {
    const years = readdirSync(archiveDir);
    for (const year of years) {
      const yearDir = join(archiveDir, year);
      try {
        const months = readdirSync(yearDir);
        for (const month of months) {
          const monthDir = join(yearDir, month);
          try {
            const files = readdirSync(monthDir);
            if (files.some((f) => f.startsWith(requestId))) {
              return true;
            }
          } catch {
            // Month directory doesn't exist or can't be read
          }
        }
      } catch {
        // Year directory doesn't exist or can't be read
      }
    }
  } catch {
    // Archive directory doesn't exist or can't be read
  }

  return false;
}

interface RuleOptions {
  validateInComments?: boolean;
  validateInStrings?: boolean;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Validate that CR/FR references in comments exist as request files",
      category: "Traceability",
      recommended: true,
    },
    messages: {
      crFrNotFound:
        "CR/FR reference '{{requestId}}' not found in docs/requests/. " +
        "Create the request first: node scripts/run.mjs {{command}}:new <domain> <slug>",
    },
    schema: [
      {
        type: "object",
        properties: {
          validateInComments: {
            type: "boolean",
            description: "Validate CR/FR references in all comments",
          },
          validateInStrings: {
            type: "boolean",
            description: "Validate CR/FR references in string literals",
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const options: RuleOptions = context.options[0] || {};
    const validateInComments = options.validateInComments !== false;

    // Skip test files - they may reference historical CRs
    if (filename.includes("__tests__") || filename.includes(".test.")) {
      return {};
    }

    // Skip eslint rule files - they document patterns that include CR/FR references
    if (
      filename.includes("eslint/rules/") ||
      filename.includes("eslint-plugin/src/rules/")
    ) {
      return {};
    }

    const projectRoot = findProjectRoot(dirname(filename));
    const reportedIds = new Set<string>();

    function validateCrFrReferences(
      text: string,
      loc: Rule.Node["loc"],
    ): void {
      const matches = text.matchAll(CR_FR_PATTERN);
      for (const match of matches) {
        const requestId = match[0];

        // Skip if already reported
        if (reportedIds.has(requestId)) {
          continue;
        }

        if (!requestFileExistsSync(projectRoot, requestId)) {
          reportedIds.add(requestId);
          const command = requestId.startsWith("CR") ? "cr" : "fr";
          context.report({
            loc: loc!,
            messageId: "crFrNotFound",
            data: { requestId, command },
          });
        }
      }
    }

    return {
      Program() {
        if (!validateInComments) {
          return;
        }

        const sourceCode = context.sourceCode || context.getSourceCode();
        const comments = sourceCode.getAllComments();

        for (const comment of comments) {
          // Check eslint disable comments and tracked comment patterns
          // Uses character class to avoid triggering lint rules on this file
          const trackedPattern = /eslin\u0074-disable|TO[D]O|FIX[M]E|HAC[K]|XX[X]/i;
          const isRelevantComment = trackedPattern.test(comment.value);
          if (isRelevantComment) {
            validateCrFrReferences(comment.value, comment.loc);
          }
        }
      },
    };
  },
};

export default rule;
