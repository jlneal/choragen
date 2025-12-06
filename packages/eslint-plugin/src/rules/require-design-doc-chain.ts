/**
 * Rule: require-design-doc-chain
 *
 * Enforces that design docs in docs/design/ link to their governing ADRs.
 * Design docs must reference at least one ADR to maintain traceability.
 *
 * Valid:
 *   ## Related ADRs
 *   - [ADR-001-example](../adr/ADR-001-example.md)
 *
 * Invalid:
 *   (no ADR reference in design doc)
 *
 * ADR: ADR-002-governance-schema
 */

import type { Rule } from "eslint";

// Pattern to match ADR references in markdown content
const ADR_REFERENCE_PATTERN = /ADR-\d+-[\w-]+/;

// Patterns that indicate ADR sections in design docs
const ADR_SECTION_PATTERNS = [
  /##\s*Related ADRs?/i,
  /##\s*Architecture Decisions?/i,
  /##\s*Governing ADRs?/i,
  /##\s*ADR References?/i,
];

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require design docs to reference their governing ADRs for traceability",
      category: "Traceability",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          designDocPatterns: {
            type: "array",
            items: { type: "string" },
            description: "Glob patterns for design doc files",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingAdrReference:
        "Design doc must reference at least one governing ADR. " +
        "Add a '## Related ADRs' section with links to the relevant ADRs.",
    },
  },

  create(context) {
    const filename = context.filename || context.getFilename();

    // Only run on files in docs/design/
    if (!filename.includes("docs/design/") || !filename.endsWith(".md")) {
      return {};
    }

    return {
      Program(node) {
        const sourceCode = context.sourceCode || context.getSourceCode();
        const text = sourceCode.getText();

        // Check if file has an ADR section
        const hasAdrSection = ADR_SECTION_PATTERNS.some((pattern) =>
          pattern.test(text)
        );

        // Check if file has any ADR reference
        const hasAdrReference = ADR_REFERENCE_PATTERN.test(text);

        if (!hasAdrSection && !hasAdrReference) {
          context.report({
            node,
            messageId: "missingAdrReference",
          });
        }
      },
    };
  },
};

export default rule;
