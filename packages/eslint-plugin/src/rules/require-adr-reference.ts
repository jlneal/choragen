/**
 * Rule: require-adr-reference
 *
 * Enforces that source files reference their governing ADR.
 *
 * Valid:
 *   // ADR: ADR-001-task-file-format
 *   // @adr ADR-001-task-file-format
 *
 * Invalid:
 *   (no ADR reference comment)
 */

import type { Rule } from "eslint";

const ADR_PATTERN = /(?:ADR:|@adr)\s*(ADR-\d+-[\w-]+)/;

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require source files to reference their governing ADR",
      category: "Traceability",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          excludePatterns: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingAdrReference:
        "Source file must reference its governing ADR. Add a comment like: // ADR: ADR-001-example",
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const excludePatterns = options.excludePatterns || [
      "**/__tests__/**",
      "**/test/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/index.ts",
    ];

    const filename = context.filename || context.getFilename();

    // Check if file is excluded
    for (const pattern of excludePatterns) {
      if (matchPattern(pattern, filename)) {
        return {};
      }
    }

    let hasAdrReference = false;

    return {
      Program(node) {
        const sourceCode = context.sourceCode || context.getSourceCode();
        const comments = sourceCode.getAllComments();

        for (const comment of comments) {
          if (ADR_PATTERN.test(comment.value)) {
            hasAdrReference = true;
            break;
          }
        }

        if (!hasAdrReference) {
          context.report({
            node,
            messageId: "missingAdrReference",
          });
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
