/**
 * Rule: no-untracked-todos
 *
 * Enforces that TODO/FIXME/HACK comments include a CR/FR reference.
 *
 * Valid:
 *   // TODO(CR-20251206-002): Add validation
 *   // FIXME(FR-20251206-001): Fix race condition
 *   // TODO(#123): GitHub issue reference
 *
 * Invalid:
 *   // TODO: fix this later
 *   // FIXME: needs refactoring
 *
 * ADR: ADR-002-governance-schema
 */

import type { Rule } from "eslint";

const COMMENT_PREVIEW_LENGTH = 50;

// Pattern to match valid references:
// - CR-YYYYMMDD-NNN
// - FR-YYYYMMDD-NNN
// - #123 (GitHub issue)
const VALID_REFERENCE_PATTERN =
  /\b(TODO|FIXME|HACK|XXX)\s*\(\s*(CR-\d{8}-\d{3}|FR-\d{8}-\d{3}|#\d+)\s*\)/i;

// Pattern to detect ADR reference blocks (these contain "todo" in paths like docs/adr/todo/)
const ADR_REFERENCE_PATTERN = /^\s*\*?\s*-?\s*docs\/adr\//;
const ADR_BLOCK_START_PATTERN = /ADR\s+References?:/i;

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prevent TODO/FIXME comments without tracking references (CR/FR)",
      category: "Traceability",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          keywords: {
            type: "array",
            items: { type: "string" },
            default: ["TODO", "FIXME", "HACK", "XXX"],
          },
          allowNoReference: {
            type: "boolean",
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      untrackedTodo:
        "TODO/FIXME/HACK must reference a tracking issue:\n" +
        "  - TODO(CR-YYYYMMDD-NNN): description\n" +
        "  - TODO(FR-YYYYMMDD-NNN): description\n" +
        "  - TODO(#123): description\n" +
        "  Found: {{comment}}",
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const keywords: string[] = options.keywords || [
      "TODO",
      "FIXME",
      "HACK",
      "XXX",
    ];
    const allowNoReference = options.allowNoReference === true;

    // Pattern to match the configured keywords (case-sensitive)
    const todoPattern = new RegExp(`\\b(${keywords.join("|")})\\b`);

    return {
      Program() {
        const sourceCode = context.sourceCode || context.getSourceCode();
        const comments = sourceCode.getAllComments();

        for (const comment of comments) {
          const text = comment.value;

          // Skip ADR reference blocks entirely (they contain paths like docs/adr/todo/)
          if (
            ADR_BLOCK_START_PATTERN.test(text) ||
            ADR_REFERENCE_PATTERN.test(text)
          ) {
            continue;
          }

          // Check if comment contains a tracked keyword (case-sensitive)
          if (todoPattern.test(text)) {
            // Check if it has a valid reference
            if (!VALID_REFERENCE_PATTERN.test(text) && !allowNoReference) {
              context.report({
                loc: comment.loc!,
                messageId: "untrackedTodo",
                data: {
                  comment: text.trim().substring(0, COMMENT_PREVIEW_LENGTH),
                },
              });
            }
          }
        }
      },
    };
  },
};

export default rule;
