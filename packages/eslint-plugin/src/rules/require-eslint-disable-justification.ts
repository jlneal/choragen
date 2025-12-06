/**
 * Rule: require-eslint-disable-justification
 *
 * Requires that eslint-disable comments include a justification after "--".
 *
 * Valid:
 *   // eslint-disable-next-line no-console -- Debug logging for development
 *   // eslint-disable @typescript-eslint/no-explicit-any -- Legacy API requires this
 *
 * Invalid:
 *   // eslint-disable-next-line no-console
 *   // eslint-disable @typescript-eslint/no-explicit-any
 *
 * ADR: ADR-002-governance-schema
 */

import type { Rule } from "eslint";

const JUSTIFICATION_SEPARATOR = "--";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require justification comment for eslint-disable directives",
      category: "Code Hygiene",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          requireCrFr: {
            type: "boolean",
            description:
              "If true, requires CR/FR reference (not just any justification)",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingJustification:
        'ESLint disable comment must include justification after "-- ". ' +
        "Example: // eslint-disable-next-line rule -- reason for disabling",
      missingCrFrReference:
        "Consider adding a CR/FR reference for better traceability: " +
        "-- TODO(CR-xxx): reason",
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const requireCrFr = options.requireCrFr === true;

    return {
      Program() {
        const sourceCode = context.sourceCode || context.getSourceCode();
        const comments = sourceCode.getAllComments();

        for (const comment of comments) {
          const text = comment.value;

          if (!isEslintDisableComment(text)) {
            continue;
          }

          if (!hasJustification(text)) {
            context.report({
              loc: comment.loc!,
              messageId: "missingJustification",
            });
          } else if (requireCrFr && !hasCrFrReference(text)) {
            context.report({
              loc: comment.loc!,
              messageId: "missingCrFrReference",
            });
          }
        }
      },
    };
  },
};

/**
 * Check if this is an eslint-disable directive comment
 */
function isEslintDisableComment(commentText: string): boolean {
  return /eslint-disable(-next-line|-line)?/.test(commentText);
}

/**
 * Check if comment text has a justification after --
 */
function hasJustification(commentText: string): boolean {
  const separatorIndex = commentText.indexOf(JUSTIFICATION_SEPARATOR);
  if (separatorIndex === -1) {
    return false;
  }
  // Check there's actual content after the separator
  const afterSeparator = commentText
    .slice(separatorIndex + JUSTIFICATION_SEPARATOR.length)
    .trim();
  return afterSeparator.length > 0;
}

/**
 * Check if comment includes a CR/FR reference
 */
function hasCrFrReference(commentText: string): boolean {
  return /\b(CR|FR)-\d{8}-\d{3}\b/.test(commentText);
}

export default rule;
