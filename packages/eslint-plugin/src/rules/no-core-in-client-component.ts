/**
 * Rule: no-core-in-client-component
 *
 * Disallows runtime imports from @choragen/core in Next.js client components.
 * @choragen/core contains Node.js-specific APIs that cannot be bundled for
 * client-side rendering.
 *
 * Blocked:
 *   "use client";
 *   import { FeedbackManager } from "@choragen/core";
 *
 * Allowed:
 *   "use client";
 *   import type { WorkflowMessage } from "@choragen/core";
 *
 *   // Server component (no "use client")
 *   import { FeedbackManager } from "@choragen/core";
 *
 * ADR: ADR-002-governance-schema (code hygiene enforcement)
 * CR: CR-20251214-001
 * FR: FR-20251214-001 (webpack __webpack_require__ error)
 */

import type { Rule } from "eslint";

interface ProgramBody {
  type: string;
  expression?: { type: string; value: unknown };
  directive?: string;
}

interface ImportNode {
  source: { value: string };
  importKind?: string;
  specifiers: Array<{
    type: string;
    importKind?: string;
  }>;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow runtime imports from @choragen/core in client components",
      category: "Next.js",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          packages: {
            type: "array",
            items: { type: "string" },
            description:
              "Additional packages to restrict (default: ['@choragen/core'])",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noRuntimeImport:
        "Runtime import from '{{package}}' is not allowed in client components. " +
        "Use 'import type { ... }' for types, or import from '@choragen/contracts' for runtime values.",
    },
  },

  create(context) {
    const options = (context.options[0] || {}) as { packages?: string[] };
    const restrictedPackages = new Set(
      options.packages || ["@choragen/core"]
    );

    let isClientComponent = false;
    let hasCheckedDirective = false;

    return {
      Program(node: any) {
        // Reset state for each file
        isClientComponent = false;
        hasCheckedDirective = false;

        // Check for "use client" directive at the start of the file
        const body = node.body as ProgramBody[];

        for (const statement of body) {
          // Directive can be in ExpressionStatement with Literal
          if (
            statement.type === "ExpressionStatement" &&
            statement.expression?.type === "Literal" &&
            statement.expression?.value === "use client"
          ) {
            isClientComponent = true;
            break;
          }
          // Or as a directive property (older ESLint AST format)
          if (statement.directive === "use client") {
            isClientComponent = true;
            break;
          }
          // Stop checking after first non-directive statement
          if (statement.type !== "ExpressionStatement") {
            break;
          }
          // If it's an expression but not a string literal directive, stop
          if (
            statement.expression?.type !== "Literal" ||
            typeof statement.expression?.value !== "string"
          ) {
            break;
          }
        }
        hasCheckedDirective = true;
      },

      ImportDeclaration(node: any) {
        if (!hasCheckedDirective || !isClientComponent) {
          return;
        }

        const importNode = node as ImportNode;
        const packageName = importNode.source.value;

        // Check if this is a restricted package
        if (!restrictedPackages.has(packageName)) {
          return;
        }

        // Allow type-only imports (import type { ... })
        if (importNode.importKind === "type") {
          return;
        }

        // Check if all specifiers are type imports
        const hasRuntimeImport = importNode.specifiers.some(
          (specifier) =>
            specifier.type === "ImportSpecifier" &&
            specifier.importKind !== "type"
        );

        // Also check for default imports and namespace imports
        const hasDefaultOrNamespace = importNode.specifiers.some(
          (specifier) =>
            specifier.type === "ImportDefaultSpecifier" ||
            specifier.type === "ImportNamespaceSpecifier"
        );

        if (hasRuntimeImport || hasDefaultOrNamespace) {
          context.report({
            node,
            messageId: "noRuntimeImport",
            data: { package: packageName },
          });
        }
      },
    };
  },
};

export default rule;
