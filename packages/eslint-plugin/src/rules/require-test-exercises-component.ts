/**
 * Rule: require-test-exercises-component
 *
 * Ensures that component test files actually render and exercise components.
 * Tests that just import a component without rendering are meaningless.
 *
 * Blocked:
 *   // Just imports, no render
 *   import { Button } from './Button';
 *   it('should exist', () => { expect(Button).toBeDefined(); });
 *
 * Allowed:
 *   import { Button } from './Button';
 *   it('should render', () => {
 *     render(<Button />);
 *     expect(screen.getByRole('button')).toBeInTheDocument();
 *   });
 *
 * ADR: ADR-002-governance-schema
 */

import type { Rule } from "eslint";

// Query methods for testing-library
const QUERY_METHODS = new Set([
  "getByRole",
  "getByText",
  "getByTestId",
  "getByLabelText",
  "getByPlaceholderText",
  "getByAltText",
  "getByTitle",
  "getByDisplayValue",
  "queryByRole",
  "queryByText",
  "queryByTestId",
  "findByRole",
  "findByText",
  "findByTestId",
  "getAllByRole",
  "getAllByText",
  "screen",
]);

// Jest-DOM matchers
const JEST_DOM_MATCHERS = new Set([
  "toBeInTheDocument",
  "toBeVisible",
  "toHaveTextContent",
  "toHaveAttribute",
  "toHaveClass",
  "toHaveStyle",
  "toBeDisabled",
  "toBeEnabled",
  "toBeChecked",
  "toHaveValue",
  "toContainElement",
  "toContainHTML",
]);

/**
 * Check if a call is a render call (including common wrapper patterns)
 */
function isRenderCall(node: any): boolean {
  if (node.callee.type === "Identifier") {
    const name = node.callee.name;
    // Direct render() call or common wrapper patterns: renderWith*, render*
    if (name === "render" || name.startsWith("render")) {
      return true;
    }
  }
  if (
    node.callee.type === "MemberExpression" &&
    node.callee.property.type === "Identifier" &&
    node.callee.property.name === "render"
  ) {
    return true;
  }
  return false;
}

/**
 * Check if a call is a meaningful assertion
 */
function isMeaningfulAssertion(node: any): boolean {
  if (
    node.callee.type === "Identifier" &&
    QUERY_METHODS.has(node.callee.name)
  ) {
    return true;
  }
  if (
    node.callee.type === "MemberExpression" &&
    node.callee.property.type === "Identifier"
  ) {
    const propName = node.callee.property.name;
    if (QUERY_METHODS.has(propName) || JEST_DOM_MATCHERS.has(propName)) {
      return true;
    }
  }
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Validate that component test files actually render and exercise the components they test",
      category: "Test Quality",
      recommended: true,
    },
    messages: {
      noRenderCall:
        "Component test file has no render() or mount() calls. " +
        "Component tests should render the component using @testing-library/react.",
      noComponentReference:
        "Test file should import or reference the component it's testing. " +
        "Import the component from '{{componentPath}}'.",
      stubTestFile:
        "Test file appears to be a stub with no meaningful test logic. " +
        "Add actual test cases that render and interact with the component.",
      noInteractionOrAssertion:
        "Test file renders component but has no user interactions or meaningful assertions. " +
        "Add userEvent interactions or assertions on rendered output (getByRole, getByText, etc.).",
      renderOutsideTests:
        "render() calls found but not inside test blocks (it/test). " +
        "Move render calls inside test functions to actually exercise the component.",
    },
    schema: [
      {
        type: "object",
        properties: {
          requireInteractions: {
            type: "boolean",
            default: false,
            description: "Require user interactions in tests (not just render)",
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const filename = context.filename || context.getFilename();

    // Only check component test files (TSX tests in components directories)
    // Exclude non-component tests
    const basename = filename.split("/").pop() || "";
    const isHookTest =
      basename.startsWith("use") ||
      /\/use[A-Z][^/]*\.test\.tsx$/.test(filename);
    const isClientTest =
      basename.includes("Client.") && basename.includes(".test.");
    const isControllerTest =
      basename.includes("Controller.") && basename.includes(".test.");
    const isIntegrationTest = basename.includes(".integration.");
    const shouldCheck =
      filename.endsWith(".test.tsx") &&
      (filename.includes("/components/") || filename.includes("Components")) &&
      !filename.includes("__tests__/api/") &&
      !filename.includes("/helpers/") &&
      !filename.includes("/mocks/") &&
      !isHookTest &&
      !isClientTest &&
      !isControllerTest &&
      !isIntegrationTest;

    if (!shouldCheck) {
      return {};
    }

    // Track state
    let renderCallsTotal = 0;
    let hasMeaningfulAssertions = false;

    return {
      CallExpression(node: any) {
        if (isRenderCall(node)) {
          renderCallsTotal++;
        }

        if (isMeaningfulAssertion(node)) {
          hasMeaningfulAssertions = true;
        }
      },

      "Program:exit"(programNode: any) {
        const sourceCode = context.sourceCode || context.getSourceCode();
        const fullText = sourceCode.getText();

        // Count active tests
        const testMatches = fullText.match(/\b(it|test)\s*\(/g) || [];
        const skipMatches = fullText.match(/\.(skip|todo)\s*\(/g) || [];
        const activeTests = testMatches.length - skipMatches.length;

        if (activeTests === 0) {
          context.report({
            node: programNode,
            loc: { line: 1, column: 0 },
            messageId: "stubTestFile",
          });
          return;
        }

        // Check for render calls (or alternatives)
        // Use regex as fallback since AST may miss render calls in helper functions
        if (renderCallsTotal === 0) {
          const hasRenderPattern = /\brender\w*\s*\(/.test(fullText);
          const hasAltRender = /\b(mount|shallow|create|TestRenderer)\b/.test(
            fullText
          );
          if (!hasRenderPattern && !hasAltRender) {
            context.report({
              node: programNode,
              loc: { line: 1, column: 0 },
              messageId: "noRenderCall",
            });
            return;
          }
        }

        // Note: We don't check if render is inside tests because helper functions are valid
        // The key requirement is that render() is called somewhere in the file

        // Check for assertions
        if (!hasMeaningfulAssertions && !/\bexpect\s*\(/.test(fullText)) {
          context.report({
            node: programNode,
            loc: { line: 1, column: 0 },
            messageId: "noInteractionOrAssertion",
          });
        }
      },
    };
  },
};

export default rule;
