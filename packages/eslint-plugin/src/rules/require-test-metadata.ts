// ADR: ADR-002-governance-schema

/**
 * Rule: require-test-metadata
 *
 * Enforces that test files have proper metadata linking to design docs.
 *
 * Valid:
 *   /**
 *    * @design-doc docs/design/core/features/task-chain-management.md
 *    * @user-intent "Control agent can create chains from CRs"
 *    * @test-type unit
 *    *\/
 *
 * Invalid:
 *   (no metadata block)
 */

import type { Rule } from "eslint";

const DESIGN_DOC_PATTERN = /@design-doc\s+\S+/;
const USER_INTENT_PATTERN = /@user-intent\s+["'].+["']/;

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require test files to have design doc metadata",
      category: "Traceability",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          requireUserIntent: {
            type: "boolean",
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingDesignDoc:
        "Test file must reference its design doc. Add: @design-doc <path>",
      missingUserIntent:
        'Test file must describe user intent. Add: @user-intent "<description>"',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const requireUserIntent = options.requireUserIntent !== false;

    const filename = context.filename || context.getFilename();

    // Only apply to test files
    if (!isTestFile(filename)) {
      return {};
    }

    let hasDesignDoc = false;
    let hasUserIntent = false;

    return {
      Program(node) {
        const sourceCode = context.sourceCode || context.getSourceCode();
        const comments = sourceCode.getAllComments();

        for (const comment of comments) {
          if (DESIGN_DOC_PATTERN.test(comment.value)) {
            hasDesignDoc = true;
          }
          if (USER_INTENT_PATTERN.test(comment.value)) {
            hasUserIntent = true;
          }
        }

        if (!hasDesignDoc) {
          context.report({
            node,
            messageId: "missingDesignDoc",
          });
        }

        if (requireUserIntent && !hasUserIntent) {
          context.report({
            node,
            messageId: "missingUserIntent",
          });
        }
      },
    };
  },
};

function isTestFile(filename: string): boolean {
  return (
    filename.includes("__tests__") ||
    filename.includes(".test.") ||
    filename.includes(".spec.")
  );
}

export default rule;
