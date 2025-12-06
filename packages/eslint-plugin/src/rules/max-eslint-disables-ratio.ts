/**
 * Rule: max-eslint-disables-ratio
 *
 * Enforces ratio-based limit on eslint-disable comments per lines of code.
 * Complements max-eslint-disables-per-file by using a ratio instead of
 * absolute count, which scales better for large files.
 *
 * A 50-line file with 3 disables is worse than a 500-line file with 3 disables.
 *
 * Valid (with default of 1 disable per 100 lines):
 *   200-line file with 2 eslint-disable comments
 *
 * Invalid:
 *   50-line file with 3 eslint-disable comments (1 per 17 lines)
 *
 * ADR: ADR-002-governance-schema
 */

import type { Rule } from "eslint";

const DEFAULT_LINES_PER_DISABLE = 100;
const MIN_FILE_LINES_DEFAULT = 20;

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce ratio-based limit on eslint-disable comments per lines of code",
      category: "Code Hygiene",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          linesPerDisable: {
            type: "integer",
            minimum: 10,
            description:
              "Minimum lines of code per eslint-disable comment allowed",
          },
          minFileLines: {
            type: "integer",
            minimum: 1,
            description:
              "Minimum file size to apply ratio check (smaller files exempt)",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooManyDisablesForSize:
        "File has {{ count }} eslint-disable comment(s) in {{ lines }} lines " +
        "(1 per {{ ratio }} lines). Maximum allowed is 1 per {{ maxRatio }} lines. " +
        "Reduce disables or refactor the file.",
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const linesPerDisable =
      typeof options.linesPerDisable === "number"
        ? options.linesPerDisable
        : DEFAULT_LINES_PER_DISABLE;
    const minFileLines =
      typeof options.minFileLines === "number"
        ? options.minFileLines
        : MIN_FILE_LINES_DEFAULT;

    return {
      Program(node) {
        const sourceCode = context.sourceCode || context.getSourceCode();
        const totalLines = sourceCode.lines.length;

        // Skip very small files
        if (totalLines < minFileLines) {
          return;
        }

        const comments = sourceCode.getAllComments();

        // Count eslint-disable comments (actual directives, not mentions in docs)
        const disableCount = comments.filter((comment) =>
          isEslintDisableComment(comment.value)
        ).length;

        if (disableCount === 0) {
          return;
        }

        // Always allow at least 1 disable per file regardless of size
        if (disableCount === 1) {
          return;
        }

        // Calculate ratio
        const actualRatio = Math.round(totalLines / disableCount);

        if (actualRatio < linesPerDisable) {
          context.report({
            node,
            loc: { line: 1, column: 0 },
            messageId: "tooManyDisablesForSize",
            data: {
              count: String(disableCount),
              lines: String(totalLines),
              ratio: String(actualRatio),
              maxRatio: String(linesPerDisable),
            },
          });
        }
      },
    };
  },
};

/**
 * Check if this is an eslint-disable directive comment
 * Directives start at the beginning of the comment (after optional whitespace)
 */
function isEslintDisableComment(commentText: string): boolean {
  return /^\s*eslint-disable(-next-line|-line)?(\s|$)/.test(commentText);
}

export default rule;
