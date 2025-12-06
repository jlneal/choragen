/**
 * Rule: require-adr-implementation
 *
 * Enforces that ADRs in docs/adr/done/ have source file references,
 * ensuring bidirectional traceability between architectural decisions
 * and their implementations.
 *
 * Complements validate:adr-implementation script by providing real-time
 * feedback when editing ADR files.
 *
 * ADR: ADR-002-governance-schema (traceability requirements)
 */

import type { Rule } from "eslint";
import { basename } from "node:path";

// Patterns that indicate source file references
const SOURCE_REFERENCE_PATTERNS = {
  // File path patterns - common source directories
  filePaths: /(?:app|lib|components|src|packages)\/[\w/.-]+\.(?:ts|tsx|js|jsx)/g,
  // Explicit "Implementation:" or "Source:" sections
  implementationSection: /^##\s*(?:Implementation|Source|Code)\s*(?:Files?|References?)?/im,
  // "See:" references to source files
  seeReferences: /See:\s*`[^`]+\.(?:ts|tsx|js|jsx)`/g,
};

const MIN_SOURCE_REFERENCES = 1;

/**
 * Check if an ADR file has source file references
 */
function checkSourceReferences(content: string): {
  hasReferences: boolean;
  count: number;
} {
  let count = 0;

  // Check for file path patterns
  const filePathMatches = content.match(SOURCE_REFERENCE_PATTERNS.filePaths);
  if (filePathMatches) {
    count += filePathMatches.length;
  }

  // Check for explicit implementation sections
  if (SOURCE_REFERENCE_PATTERNS.implementationSection.test(content)) {
    count += 1;
  }

  // Check for "See:" references
  const seeMatches = content.match(SOURCE_REFERENCE_PATTERNS.seeReferences);
  if (seeMatches) {
    count += seeMatches.length;
  }

  return {
    hasReferences: count >= MIN_SOURCE_REFERENCES,
    count,
  };
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce ADRs in done/ have source file references for traceability",
      category: "Traceability",
      recommended: true,
    },
    messages: {
      missingSourceReferences:
        "ADR in done/ should reference implementing source files. Add an '## Implementation' section with file paths like:\n\n## Implementation\n\n- `lib/feature/module.ts` - Main implementation\n- `app/api/feature/route.ts` - API endpoint",
      adrShouldBeArchived:
        "ADR '{{filename}}' has no source references and may be stale. Either:\n1. Add source file references if still governing implementation\n2. Move to docs/adr/archive/ if superseded",
    },
    schema: [
      {
        type: "object",
        properties: {
          minSourceReferences: {
            type: "integer",
            default: 1,
            description: "Minimum number of source file references required",
          },
          exemptPatterns: {
            type: "array",
            items: { type: "string" },
            default: [],
            description: "ADR filename patterns to exempt from this rule",
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const options = context.options[0] || {};
    const exemptPatterns: string[] = options.exemptPatterns || [];

    // Only validate ADR files in docs/adr/done/
    if (!filename.includes("docs/adr/done/") || !filename.endsWith(".md")) {
      return {};
    }

    // Check if file is exempt
    const adrFilename = basename(filename);
    const isExempt = exemptPatterns.some((pattern: string) => {
      if (pattern.includes("*")) {
        const regex = new RegExp(pattern.replace(/\*/g, ".*"));
        return regex.test(adrFilename);
      }
      return adrFilename.includes(pattern);
    });

    if (isExempt) {
      return {};
    }

    return {
      Program(node) {
        const sourceCode = context.sourceCode || context.getSourceCode();
        const content = sourceCode.getText();

        const { hasReferences } = checkSourceReferences(content);

        if (!hasReferences) {
          context.report({
            node,
            loc: { line: 1, column: 0 },
            messageId: "adrShouldBeArchived",
            data: { filename: adrFilename },
          });
        }
      },
    };
  },
};

export default rule;
