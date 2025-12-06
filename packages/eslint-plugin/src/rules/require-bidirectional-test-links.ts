// ADR: ADR-002-governance-schema

/**
 * Rule: require-bidirectional-test-links
 *
 * Enforces bidirectional links between test files and design docs.
 * When a test has @design-doc metadata, the referenced design doc
 * must link back to the test file in its "Acceptance Tests" section.
 *
 * This prevents agents from adding test metadata without updating
 * the design doc, breaking bidirectional traceability.
 *
 * Valid:
 *   Test has @design-doc and design doc links back to test
 *
 * Invalid:
 *   Test has @design-doc but design doc doesn't link back
 */

import type { Rule } from "eslint";
import { existsSync, readFileSync } from "fs";
import { basename, dirname, join, relative } from "path";

const DESIGN_DOC_PATTERN = /@design-doc\s+([^\s*]+)/i;
const METADATA_SEARCH_LINE_LIMIT = 20;

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
 * Check if design doc contains a link back to the test file
 */
function designDocLinksToTest(
  designDocContent: string,
  testFilePath: string,
  projectRoot: string,
): boolean {
  // Get relative path from project root
  const relativeTestPath = relative(projectRoot, testFilePath);
  const testFileName = basename(testFilePath);

  // Check for various ways the test might be referenced
  const patterns = [
    // Full relative path
    relativeTestPath,
    // Just the filename
    testFileName,
    // Path with backticks
    `\`${relativeTestPath}\``,
    `\`${testFileName}\``,
    // Path without leading __tests__/
    relativeTestPath.replace(/^__tests__\//, ""),
  ];

  // Look in Acceptance Tests section specifically
  const acceptanceTestsMatch = designDocContent.match(
    /## Acceptance Tests[\s\S]*?(?=\n## |$)/,
  );

  const searchContent = acceptanceTestsMatch
    ? acceptanceTestsMatch[0]
    : designDocContent;

  return patterns.some((pattern) => searchContent.includes(pattern));
}

function isTestFile(filename: string): boolean {
  return filename.endsWith(".test.ts") || filename.endsWith(".test.tsx");
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce bidirectional links between test files and design docs",
      category: "Traceability",
      recommended: true,
    },
    messages: {
      missingBacklink:
        "Test file references design doc '{{designDoc}}' but the design doc does not link back to this test. " +
        "Add this test to the design doc's '## Acceptance Tests' section.",
      missingAcceptanceSection:
        "Design doc '{{designDoc}}' is missing '## Acceptance Tests' section. " +
        "Add the section and include a link to this test file.",
    },
    schema: [
      {
        type: "object",
        properties: {
          requireAcceptanceSection: {
            type: "boolean",
            default: true,
            description:
              "If true, requires the design doc to have an Acceptance Tests section",
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const options = context.options[0] || {};
    const requireAcceptanceSection = options.requireAcceptanceSection !== false;

    // Only check test files
    if (!isTestFile(filename)) {
      return {};
    }

    const projectRoot = findProjectRoot(dirname(filename));

    return {
      Program(node) {
        const sourceCode = context.sourceCode || context.getSourceCode();

        // Look for @design-doc in the first N lines
        const lines = sourceCode.getText().split("\n");
        const metadataPreviewLines = lines
          .slice(0, METADATA_SEARCH_LINE_LIMIT)
          .join("\n");

        const designDocMatch = metadataPreviewLines.match(DESIGN_DOC_PATTERN);
        if (!designDocMatch) {
          // No @design-doc tag, nothing to check
          return;
        }

        const designDocPath = designDocMatch[1];
        const fullDesignDocPath = join(projectRoot, designDocPath);

        if (!existsSync(fullDesignDocPath)) {
          // Let require-test-metadata handle missing design docs
          return;
        }

        let designDocContent: string;
        try {
          designDocContent = readFileSync(fullDesignDocPath, "utf-8");
        } catch {
          return;
        }

        // Check if design doc has Acceptance Tests section
        const hasAcceptanceSection = /^##\s+Acceptance Tests/m.test(
          designDocContent,
        );

        if (requireAcceptanceSection && !hasAcceptanceSection) {
          context.report({
            node,
            loc: { line: 1, column: 0 },
            messageId: "missingAcceptanceSection",
            data: { designDoc: designDocPath },
          });
          return;
        }

        // Check if design doc links back to this test
        if (!designDocLinksToTest(designDocContent, filename, projectRoot)) {
          context.report({
            node,
            loc: { line: 1, column: 0 },
            messageId: "missingBacklink",
            data: { designDoc: designDocPath },
          });
        }
      },
    };
  },
};

export default rule;
