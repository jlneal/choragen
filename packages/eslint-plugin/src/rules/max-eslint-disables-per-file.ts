/**
 * Rule: max-eslint-disables-per-file
 *
 * Limits the number of eslint disable comments per file.
 * Encourages fixing issues rather than disabling rules.
 *
 * Valid (with default limit of 5):
 *   File with 5 or fewer eslint disable comments
 *
 * Invalid:
 *   File with more than 5 eslint disable comments
 *
 * ADR: ADR-002-governance-schema
 */

import type { Rule } from "eslint";

const DEFAULT_MAX_DISABLES = 5;

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Limit the number of eslint-disable comments per file",
      category: "Code Hygiene",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          max: {
            type: "integer",
            minimum: 0,
            description: "Maximum number of eslint-disable comments allowed",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooManyDisables:
        "File has {{ count }} eslint-disable comments (max: {{ max }}). " +
        "Consider fixing the underlying issues instead of disabling rules.",
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const max = typeof options.max === "number" ? options.max : DEFAULT_MAX_DISABLES;

    return {
      Program(node) {
        const sourceCode = context.sourceCode || context.getSourceCode();
        const comments = sourceCode.getAllComments();

        const disableComments = comments.filter((comment) =>
          isEslintDisableComment(comment.value)
        );

        if (disableComments.length > max) {
          context.report({
            node,
            messageId: "tooManyDisables",
            data: {
              count: String(disableComments.length),
              max: String(max),
            },
          });
        }
      },
    };
  },
};

/**
 * Check if this is an eslint disable directive comment
 */
function isEslintDisableComment(commentText: string): boolean {
  return /eslint-disable(-next-line|-line)?/.test(commentText);
}

export default rule;
