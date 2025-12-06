/**
 * Rule: require-test-for-component
 *
 * Ensures that every React component file has a corresponding test file,
 * enforcing test-first development for UI components.
 *
 * For: components/Trips/TripCard.tsx
 * Expects: components/Trips/__tests__/TripCard.test.tsx (or similar)
 *
 * ADR: ADR-002-governance-schema
 */

import type { Rule } from "eslint";
import { existsSync } from "fs";
import { basename, dirname, join, relative } from "path";

const COMPONENT_EXTENSIONS = [".tsx"];
const TEST_EXTENSIONS = [".test.tsx", ".test.ts"];
const STORY_EXTENSION = ".stories.tsx";

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

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require test files for React component files",
      category: "Best Practices",
      recommended: false,
    },
    messages: {
      missingTest:
        "Component must have a corresponding test file. Expected: {{expectedPath}}",
    },
    schema: [
      {
        type: "object",
        properties: {
          testDirectory: {
            type: "string",
            default: "__tests__",
            description: "Directory name for test files",
          },
          exemptPatterns: {
            type: "array",
            description: "File patterns exempt from test requirements",
            items: { type: "string" },
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const options = context.options[0] || {};
    const testDirectory = options.testDirectory || "__tests__";
    const exemptPatterns = options.exemptPatterns || [];

    // Only check component files in components/ directory
    if (!filename.includes("/components/")) {
      return {};
    }

    // Must be a .tsx file (React component)
    if (!COMPONENT_EXTENSIONS.some((ext) => filename.endsWith(ext))) {
      return {};
    }

    // Skip test files, stories, and index files
    if (
      filename.includes("__tests__") ||
      TEST_EXTENSIONS.some((ext) => filename.endsWith(ext)) ||
      filename.endsWith(STORY_EXTENSION) ||
      filename.endsWith("/index.tsx") ||
      filename.endsWith("/index.ts")
    ) {
      return {};
    }

    // Skip type definition files
    if (filename.endsWith(".d.ts") || filename.endsWith(".d.tsx")) {
      return {};
    }

    // Check exempt patterns
    const isExempt = exemptPatterns.some((pattern: string) =>
      filename.includes(pattern)
    );
    if (isExempt) {
      return {};
    }

    return {
      Program(node) {
        const componentDir = dirname(filename);
        const componentName = basename(filename, ".tsx");

        // Find project root
        const projectRoot = findProjectRoot(componentDir);

        // Check for test file in various locations
        const possibleTestPaths = [
          // components/Trips/__tests__/TripCard.test.tsx
          join(componentDir, testDirectory, `${componentName}.test.tsx`),
          join(componentDir, testDirectory, `${componentName}.test.ts`),
          // components/Trips/TripCard.test.tsx (co-located)
          join(componentDir, `${componentName}.test.tsx`),
          join(componentDir, `${componentName}.test.ts`),
          // components/Trips/__tests__/TripCard.unit.test.tsx
          join(componentDir, testDirectory, `${componentName}.unit.test.tsx`),
          // components/Trips/__tests__/TripCard.integration.test.tsx
          join(
            componentDir,
            testDirectory,
            `${componentName}.integration.test.tsx`
          ),
        ];

        const hasTest = possibleTestPaths.some((testPath) =>
          existsSync(testPath)
        );

        if (!hasTest) {
          const expectedPath = relative(projectRoot, possibleTestPaths[0]);
          context.report({
            node,
            loc: { line: 1, column: 0 },
            messageId: "missingTest",
            data: { expectedPath },
          });
        }
      },
    };
  },
};

export default rule;
