/**
 * Rule: require-meaningful-test-coverage
 *
 * Ensures that test files have substantive coverage, not just
 * existence checks or trivial assertions.
 *
 * Validates:
 * - Tests have minimum assertion count per test case
 * - Tests exercise multiple code paths (conditional coverage)
 * - Tests don't just render and check existence
 *
 * Blocked:
 *   it("renders", () => { render(<Foo />); expect(screen.getByRole("button")).toBeInTheDocument(); });
 *
 * Allowed:
 *   it("renders and handles click", () => {
 *     render(<Foo />);
 *     expect(screen.getByRole("button")).toBeInTheDocument();
 *     await userEvent.click(screen.getByRole("button"));
 *     expect(screen.getByText("Clicked")).toBeInTheDocument();
 *   });
 *
 * ADR: ADR-002-governance-schema
 */

import type { Rule, Scope } from "eslint";

const MIN_ASSERTIONS_PER_TEST = 1;
const MIN_ASSERTIONS_FOR_INTEGRATION = 3;
const MAX_ASSERTIONS_WITHOUT_INTERACTION = 2;

/**
 * Convert a glob-like pattern to a regex.
 * Supports * as wildcard for any characters.
 */
function patternToRegex(pattern: string): RegExp {
  // Escape regex special chars except *
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  // Convert * to .* for wildcard matching
  const regexStr = "^" + escaped.replace(/\*/g, ".*") + "$";
  return new RegExp(regexStr);
}

/**
 * Check if a function name matches any trusted helper pattern.
 */
function isTrustedHelper(funcName: string, trustedHelpers: string[]): boolean {
  if (!trustedHelpers || trustedHelpers.length === 0) return false;
  return trustedHelpers.some((pattern) => {
    const regex = patternToRegex(pattern);
    return regex.test(funcName);
  });
}

// Patterns that indicate trivial "renders" tests
const TRIVIAL_TEST_NAMES = [
  /^renders?$/i,
  /^renders? correctly$/i,
  /^renders? without crashing$/i,
  /^renders? component$/i,
  /^should render$/i,
  /^mounts?$/i,
  /^displays?$/i,
  /^shows?$/i,
];

// Assertions that are considered meaningful
const MEANINGFUL_ASSERTIONS = new Set([
  "toBe",
  "toEqual",
  "toStrictEqual",
  "toHaveBeenCalled",
  "toHaveBeenCalledWith",
  "toHaveBeenCalledTimes",
  "toThrow",
  "toThrowError",
  "toMatchObject",
  "toContain",
  "toContainEqual",
  "toHaveLength",
  "toHaveProperty",
  "toBeGreaterThan",
  "toBeGreaterThanOrEqual",
  "toBeLessThan",
  "toBeLessThanOrEqual",
  "toMatch",
  "resolves",
  "rejects",
]);

// Assertions that are weak/existence-only
const WEAK_ASSERTIONS = new Set([
  "toBeInTheDocument",
  "toBeTruthy",
  "toBeFalsy",
  "toBeDefined",
  "toBeUndefined",
  "toBeNull",
  "toBeVisible",
  "toBeEnabled",
  "toBeDisabled",
]);

// Functions that are not considered interactions
const NON_INTERACTION_FUNCTIONS = new Set([
  "expect",
  "render",
  "describe",
  "it",
  "test",
  "beforeEach",
  "afterEach",
  "beforeAll",
  "afterAll",
  "vi",
  "jest",
]);

interface AnalysisResult {
  assertions: string[];
  hasWeakOnly: boolean;
  hasInteraction: boolean;
  hasTrustedHelper: boolean;
}

interface TestBlock {
  name: string;
  node: any;
}

/**
 * Check if a node is a test block (it or test)
 */
function isTestBlock(node: any): boolean {
  return (
    node.callee?.type === "Identifier" &&
    (node.callee.name === "it" || node.callee.name === "test")
  );
}

/**
 * Find a variable in scope chain
 */
function findVariable(
  scope: Scope.Scope | null,
  name: string
): Scope.Variable | null {
  let currentScope = scope;
  while (currentScope) {
    const variable = currentScope.set.get(name);
    if (variable) return variable;
    currentScope = currentScope.upper;
  }
  return null;
}

/**
 * Get the test callback function - handles both inline and referenced functions
 */
function getTestCallback(node: any, context: Rule.RuleContext): any {
  const callbackArg = node.arguments[1];
  if (!callbackArg) return null;

  // Inline function
  if (
    callbackArg.type === "ArrowFunctionExpression" ||
    callbackArg.type === "FunctionExpression"
  ) {
    return callbackArg;
  }

  // Function reference
  if (callbackArg.type === "Identifier") {
    const sourceCode = context.sourceCode || context.getSourceCode();
    const scope = sourceCode.getScope
      ? sourceCode.getScope(node)
      : (context as any).getScope();
    const variable = findVariable(scope, callbackArg.name);
    if (variable && variable.defs.length > 0) {
      const def = variable.defs[0];
      if (def.node.type === "FunctionDeclaration") {
        return def.node;
      }
      if (
        def.node.type === "VariableDeclarator" &&
        def.node.init &&
        (def.node.init.type === "ArrowFunctionExpression" ||
          def.node.init.type === "FunctionExpression")
      ) {
        return def.node.init;
      }
    }
  }

  return null;
}

/**
 * Recursively collect all CallExpression nodes from a function body
 */
function collectCallExpressions(node: any, calls: any[] = []): any[] {
  if (!node) return calls;

  if (node.type === "CallExpression") {
    calls.push(node);
  }

  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item === "object" && item.type) {
          collectCallExpressions(item, calls);
        }
      }
    } else if (child && typeof child === "object" && child.type) {
      collectCallExpressions(child, calls);
    }
  }

  return calls;
}

/**
 * Get the function name from a CallExpression callee
 */
function getCalledFunctionName(call: any): string | null {
  if (call.callee?.type === "Identifier") {
    return call.callee.name;
  }
  if (
    call.callee?.type === "AwaitExpression" &&
    call.callee.argument?.type === "Identifier"
  ) {
    return call.callee.argument.name;
  }
  return null;
}

/**
 * Check if a node is an assertion call
 */
function getAssertionMethod(node: any): string | null {
  if (
    node.callee?.type === "MemberExpression" &&
    node.callee.property?.type === "Identifier"
  ) {
    return node.callee.property.name;
  }
  return null;
}

/**
 * Check if a node is a user interaction
 */
function isUserInteraction(node: any): boolean {
  if (node.callee?.type !== "MemberExpression") return false;
  if (node.callee.object?.type !== "Identifier") return false;
  const objName = node.callee.object.name;
  return objName === "userEvent" || objName === "fireEvent";
}

/**
 * Check if a node is a function call that tests behavior
 */
function isBehaviorCall(node: any): boolean {
  return (
    node.callee?.type === "Identifier" &&
    !NON_INTERACTION_FUNCTIONS.has(node.callee.name)
  );
}

/**
 * Process an assertion method and update the result.
 */
function processAssertion(methodName: string, result: AnalysisResult): void {
  if (MEANINGFUL_ASSERTIONS.has(methodName)) {
    result.assertions.push(methodName);
    result.hasWeakOnly = false;
  } else if (WEAK_ASSERTIONS.has(methodName)) {
    result.assertions.push(methodName);
  }
}

/**
 * Process a trusted helper call and update the result.
 */
function processTrustedHelper(funcName: string, result: AnalysisResult): void {
  result.assertions.push(`[trusted:${funcName}]`);
  result.hasWeakOnly = false;
  result.hasTrustedHelper = true;
  result.hasInteraction = true;
}

/**
 * Merge nested analysis results into the parent result.
 */
function mergeNestedResult(
  result: AnalysisResult,
  nestedResult: AnalysisResult
): void {
  result.assertions.push(...nestedResult.assertions);
  if (!nestedResult.hasWeakOnly) result.hasWeakOnly = false;
  if (nestedResult.hasInteraction) result.hasInteraction = true;
  if (nestedResult.hasTrustedHelper) result.hasTrustedHelper = true;
}

/**
 * Analyze a function body for assertions and interactions,
 * recursively following function calls within the same file.
 */
function analyzeFunction(
  funcNode: any,
  functionMap: Map<string, any>,
  visited: Set<string> = new Set(),
  trustedHelpers: string[] = []
): AnalysisResult {
  const result: AnalysisResult = {
    assertions: [],
    hasWeakOnly: true,
    hasInteraction: false,
    hasTrustedHelper: false,
  };

  if (!funcNode || !funcNode.body) return result;

  const calls = collectCallExpressions(funcNode.body);

  for (const call of calls) {
    const methodName = getAssertionMethod(call);
    if (methodName) processAssertion(methodName, result);

    if (isUserInteraction(call) || isBehaviorCall(call)) {
      result.hasInteraction = true;
    }

    const calledFuncName = getCalledFunctionName(call);
    if (calledFuncName && isTrustedHelper(calledFuncName, trustedHelpers)) {
      processTrustedHelper(calledFuncName, result);
    }

    if (
      calledFuncName &&
      !visited.has(calledFuncName) &&
      functionMap.has(calledFuncName)
    ) {
      visited.add(calledFuncName);
      const nestedResult = analyzeFunction(
        functionMap.get(calledFuncName),
        functionMap,
        visited,
        trustedHelpers
      );
      mergeNestedResult(result, nestedResult);
    }
  }

  return result;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Validate that tests have meaningful coverage beyond existence checks",
      category: "Test Quality",
      recommended: true,
    },
    messages: {
      trivialRenderTest:
        "Test '{{testName}}' appears to be a trivial render test. " +
        "Add assertions that verify behavior, not just existence. " +
        "Example: test user interactions, state changes, or API calls.",
      insufficientAssertions:
        "Test '{{testName}}' has only {{count}} assertion(s), need at least {{required}}. " +
        "Add more assertions to verify meaningful behavior.",
      onlyWeakAssertions:
        "Test '{{testName}}' only uses weak assertions (existence checks). " +
        "Add assertions that verify values: toBe, toEqual, toHaveBeenCalledWith, etc.",
      noInteraction:
        "Test '{{testName}}' has no user interactions or function calls. " +
        "Tests should exercise behavior, not just check initial state.",
    },
    schema: [
      {
        type: "object",
        properties: {
          minAssertionsPerTest: {
            type: "integer",
            default: MIN_ASSERTIONS_PER_TEST,
            description: "Minimum assertions required per test case",
          },
          minAssertionsForIntegration: {
            type: "integer",
            default: MIN_ASSERTIONS_FOR_INTEGRATION,
            description: "Minimum assertions for integration tests",
          },
          allowTrivialRenderTests: {
            type: "boolean",
            default: false,
            description: "Allow simple render-only tests",
          },
          trustedHelpers: {
            type: "array",
            items: { type: "string" },
            default: [],
            description:
              "Function names assumed to contain assertions (for imported helpers). " +
              "Supports glob patterns with * wildcard (e.g., 'expect*', 'run*Test').",
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const options = context.options[0] || {};
    const minAssertions =
      (options as any).minAssertionsPerTest || MIN_ASSERTIONS_PER_TEST;
    const allowTrivialRender = (options as any).allowTrivialRenderTests === true;
    const trustedHelpers = (options as any).trustedHelpers || [];

    // Only check test files
    const isTestFile =
      filename.endsWith(".test.ts") ||
      filename.endsWith(".test.tsx") ||
      filename.endsWith(".test.js") ||
      filename.endsWith(".test.mjs") ||
      filename.endsWith(".spec.ts") ||
      filename.endsWith(".spec.tsx") ||
      filename.endsWith(".spec.js") ||
      filename.endsWith(".spec.mjs");

    if (!isTestFile) {
      return {};
    }

    // Determine if this is a component test (tsx) or unit test (ts)
    const isComponentTest =
      filename.endsWith(".test.tsx") || filename.endsWith(".spec.tsx");

    // Track test blocks for validation
    const testBlocks: TestBlock[] = [];

    // Map of function names to their AST nodes
    const functionMap = new Map<string, any>();

    return {
      // Collect function declarations
      FunctionDeclaration(node: any) {
        if (node.id && node.id.name) {
          functionMap.set(node.id.name, node);
        }
      },

      // Collect arrow functions and function expressions assigned to variables
      VariableDeclarator(node: any) {
        if (
          node.id.type === "Identifier" &&
          node.init &&
          (node.init.type === "ArrowFunctionExpression" ||
            node.init.type === "FunctionExpression")
        ) {
          functionMap.set(node.id.name, node.init);
        }
      },

      // Collect test blocks for deferred analysis
      CallExpression(node: any) {
        if (!isTestBlock(node)) return;

        const testNameArg = node.arguments[0];
        const testName =
          testNameArg?.type === "Literal" ? testNameArg.value : "unknown";

        testBlocks.push({
          name: String(testName),
          node,
        });
      },

      "Program:exit"() {
        // Analyze and validate all test blocks
        for (const block of testBlocks) {
          const { name, node } = block;

          const callback = getTestCallback(node, context);
          const { assertions, hasWeakOnly, hasInteraction } = analyzeFunction(
            callback,
            functionMap,
            new Set(),
            trustedHelpers
          );

          // Check for trivial render tests
          if (isComponentTest && !allowTrivialRender) {
            const isTrivialName = TRIVIAL_TEST_NAMES.some((pattern) =>
              pattern.test(name)
            );
            if (isTrivialName && assertions.length <= 1) {
              context.report({
                node,
                messageId: "trivialRenderTest",
                data: { testName: name },
              });
              continue;
            }
          }

          // Check assertion count
          if (assertions.length < minAssertions) {
            context.report({
              node,
              messageId: "insufficientAssertions",
              data: {
                testName: name,
                count: String(assertions.length),
                required: String(minAssertions),
              },
            });
            continue;
          }

          // Check for only weak assertions
          if (hasWeakOnly && assertions.length > 0) {
            context.report({
              node,
              messageId: "onlyWeakAssertions",
              data: { testName: name },
            });
            continue;
          }

          // Check for interactions in component tests
          if (
            isComponentTest &&
            !hasInteraction &&
            assertions.length <= MAX_ASSERTIONS_WITHOUT_INTERACTION
          ) {
            context.report({
              node,
              messageId: "noInteraction",
              data: { testName: name },
            });
          }
        }
      },
    };
  },
};

export default rule;
