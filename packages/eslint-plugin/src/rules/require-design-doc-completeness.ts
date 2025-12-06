/**
 * Rule: require-design-doc-completeness
 *
 * Validates that design documents referenced by DesignContract have
 * required sections based on their type (scenario, use-case, feature, enhancement).
 *
 * Required sections by type:
 * - Feature: Objective, Scope, Acceptance Criteria
 * - Scenario: Context, Actor, Steps
 * - Use Case: Goal, Preconditions, Steps
 * - Enhancement: Current State, Proposed Change
 *
 * ADR: ADR-002-governance-schema (governance enforcement pattern)
 */

import type { Rule } from "eslint";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

// Minimum content length constants
const MIN_DOC_CONTENT_LENGTH = 100;
const MIN_SECTION_CONTENT_LENGTH = 20;

// Required sections for different design doc types
const REQUIRED_SECTIONS: Record<
  string,
  Array<{ pattern: RegExp; name: string }>
> = {
  feature: [
    { pattern: /^##\s+(Objective|Overview)/m, name: "Objective" },
    { pattern: /^##\s+Scope/m, name: "Scope" },
    {
      pattern: /^##\s+(Acceptance Criteria|Success Criteria)/m,
      name: "Acceptance Criteria",
    },
  ],
  enhancement: [
    {
      pattern: /^##\s+(Current State|Background|Problem)/m,
      name: "Current State",
    },
    {
      pattern: /^##\s+(Proposed Change|Solution|Implementation)/m,
      name: "Proposed Change",
    },
  ],
  "use-case": [
    { pattern: /^##\s+(Goal|Objective|Overview)/m, name: "Goal" },
    { pattern: /^##\s+(Preconditions|Prerequisites)/m, name: "Preconditions" },
    { pattern: /^##\s+(Steps|Flow|Process)/m, name: "Steps" },
  ],
  scenario: [
    { pattern: /^##\s+(Context|Background|Overview)/m, name: "Context" },
    { pattern: /^##\s+(Actor|User|Persona)/m, name: "Actor" },
    { pattern: /^##\s+(Steps|Flow|Process)/m, name: "Steps" },
  ],
};

// Placeholder patterns that indicate incomplete content
const PLACEHOLDER_PATTERNS = [
  /^TODO/i,
  /^TBD/i,
  /^\[.*\]/,
  /^<.*>/,
  /^placeholder/i,
  /^fill in/i,
  /^add content/i,
  /^describe/i,
  /^explain/i,
  /^insert/i,
  /^write/i,
  /^update this/i,
  /^needs? (to be )?(completed|filled|written|updated)/i,
  /^coming soon/i,
  /^not yet/i,
  /^pending/i,
  /^wip\b/i,
  /^work in progress/i,
  /^lorem ipsum/i,
  /^xxx+/i,
  /^\.{3,}/, // Just ellipsis
];

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
 * Determine design doc type from path
 */
function getDesignDocType(docPath: string): string {
  if (docPath.includes("/features/")) return "feature";
  if (docPath.includes("/enhancements/")) return "enhancement";
  if (docPath.includes("/use-cases/")) return "use-case";
  if (docPath.includes("/scenarios/")) return "scenario";
  return "feature"; // Default to feature requirements
}

/**
 * Check if a section has meaningful content (not just placeholder)
 */
function hasMeaningfulContent(content: string, sectionPattern: RegExp): boolean {
  const match = content.match(sectionPattern);
  if (!match || match.index === undefined) return false;

  // Find the section content (text between this heading and next heading)
  const startIndex = match.index + match[0].length;
  const nextHeadingMatch = content.slice(startIndex).match(/^##\s+/m);
  const endIndex = nextHeadingMatch?.index
    ? startIndex + nextHeadingMatch.index
    : content.length;

  const sectionContent = content.slice(startIndex, endIndex).trim();

  // Check for placeholder patterns
  if (PLACEHOLDER_PATTERNS.some((p) => p.test(sectionContent))) {
    return false;
  }

  return sectionContent.length >= MIN_SECTION_CONTENT_LENGTH;
}

/**
 * Find property in object expression
 */
function findProperty(properties: any[], name: string): any {
  return properties.find(
    (p: any) =>
      p.type === "Property" &&
      p.key.type === "Identifier" &&
      p.key.name === name
  );
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Validate that design documents referenced by DesignContract have required sections",
      category: "Traceability",
      recommended: true,
    },
    messages: {
      missingSection:
        "Design doc '{{docPath}}' is missing required section: {{section}}",
      placeholderContent:
        "Design doc '{{docPath}}' has placeholder content in section: {{section}}",
      emptyDesignDoc: "Design doc '{{docPath}}' appears to be empty or a stub",
    },
    schema: [
      {
        type: "object",
        properties: {
          validateContent: {
            type: "boolean",
            default: true,
            description: "Validate that sections have meaningful content",
          },
          strictMode: {
            type: "boolean",
            default: false,
            description: "Require all sections (not just presence)",
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const options = context.options[0] || {};
    const validateContent = options.validateContent !== false;

    // Only check API route files (where DesignContract is used)
    if (!filename.includes("/app/api/") || !filename.endsWith("route.ts")) {
      return {};
    }

    // Skip debug/dev routes
    if (
      filename.includes("/app/api/debug/") ||
      filename.includes("/app/api/dev/")
    ) {
      return {};
    }

    const projectRoot = findProjectRoot(dirname(filename));

    return {
      CallExpression(node: any) {
        // Check for DesignContract calls
        if (
          node.callee.type !== "Identifier" ||
          node.callee.name !== "DesignContract"
        ) {
          return;
        }

        if (node.arguments.length === 0) {
          return;
        }

        const configArg = node.arguments[0];
        if (configArg.type !== "ObjectExpression") {
          return;
        }

        // Find designDoc property
        const designDocProp = findProperty(configArg.properties, "designDoc");

        if (
          !designDocProp ||
          !designDocProp.value ||
          designDocProp.value.type !== "Literal" ||
          typeof designDocProp.value.value !== "string"
        ) {
          return;
        }

        const docPath = designDocProp.value.value;
        const fullPath = join(projectRoot, docPath);

        if (!existsSync(fullPath)) {
          // Let require-design-contract handle missing files
          return;
        }

        let content: string;
        try {
          content = readFileSync(fullPath, "utf-8");
        } catch {
          return;
        }

        // Check for empty/stub doc
        const contentWithoutFrontmatter = content
          .replace(/^---[\s\S]*?---/m, "")
          .trim();
        if (contentWithoutFrontmatter.length < MIN_DOC_CONTENT_LENGTH) {
          context.report({
            node: designDocProp.value,
            messageId: "emptyDesignDoc",
            data: { docPath },
          });
          return;
        }

        // Determine doc type and check required sections
        const docType = getDesignDocType(docPath);
        const requiredSections = REQUIRED_SECTIONS[docType] || [];

        for (const section of requiredSections) {
          if (!section.pattern.test(content)) {
            context.report({
              node: designDocProp.value,
              messageId: "missingSection",
              data: { docPath, section: section.name },
            });
          } else if (
            validateContent &&
            !hasMeaningfulContent(content, section.pattern)
          ) {
            context.report({
              node: designDocProp.value,
              messageId: "placeholderContent",
              data: { docPath, section: section.name },
            });
          }
        }
      },
    };
  },
};

export default rule;
