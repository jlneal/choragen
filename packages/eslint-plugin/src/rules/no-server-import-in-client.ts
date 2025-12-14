/**
 * Rule: no-server-import-in-client
 *
 * Disallows runtime imports from server-only packages in Next.js client components.
 * Server-only packages contain Node.js-specific APIs that cannot be bundled for
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
 * FR: FR-20251214-002
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

interface PackageConfig {
  pattern: string;
  message?: string;
}

type PackageEntry = string | PackageConfig;

interface RuleOptions {
  packages?: PackageEntry[];
}

const DEFAULT_PACKAGES: PackageConfig[] = [
  {
    pattern: "@choragen/core",
    message:
      "Use 'import type { ... }' for types, or import from '@choragen/contracts' for runtime values.",
  },
];

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow runtime imports from server-only packages in client components",
      category: "Next.js",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          packages: {
            type: "array",
            items: {
              oneOf: [
                { type: "string" },
                {
                  type: "object",
                  properties: {
                    pattern: { type: "string" },
                    message: { type: "string" },
                  },
                  required: ["pattern"],
                  additionalProperties: false,
                },
              ],
            },
            description:
              "Packages/patterns to restrict. Supports glob patterns (e.g., '@/server/**')",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noRuntimeImport:
        "Runtime import from '{{package}}' is not allowed in client components. {{suggestion}}",
    },
  },

  create(context) {
    const options = (context.options[0] || {}) as RuleOptions;
    const packageConfigs = normalizePackages(options.packages);

    let isClientComponent = false;
    let hasCheckedDirective = false;

    return {
      Program(node: any) {
        isClientComponent = false;
        hasCheckedDirective = false;

        const body = node.body as ProgramBody[];

        for (const statement of body) {
          if (
            statement.type === "ExpressionStatement" &&
            statement.expression?.type === "Literal" &&
            statement.expression?.value === "use client"
          ) {
            isClientComponent = true;
            break;
          }
          if (statement.directive === "use client") {
            isClientComponent = true;
            break;
          }
          if (statement.type !== "ExpressionStatement") {
            break;
          }
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

        const matchedConfig = findMatchingConfig(packageName, packageConfigs);
        if (!matchedConfig) {
          return;
        }

        if (importNode.importKind === "type") {
          return;
        }

        const hasRuntimeImport = importNode.specifiers.some(
          (specifier) =>
            specifier.type === "ImportSpecifier" &&
            specifier.importKind !== "type"
        );

        const hasDefaultOrNamespace = importNode.specifiers.some(
          (specifier) =>
            specifier.type === "ImportDefaultSpecifier" ||
            specifier.type === "ImportNamespaceSpecifier"
        );

        if (hasRuntimeImport || hasDefaultOrNamespace) {
          context.report({
            node,
            messageId: "noRuntimeImport",
            data: {
              package: packageName,
              suggestion:
                matchedConfig.message ||
                "Use 'import type { ... }' for types only.",
            },
          });
        }
      },
    };
  },
};

export default rule;

function normalizePackages(packages?: PackageEntry[]): PackageConfig[] {
  if (!packages || packages.length === 0) {
    return DEFAULT_PACKAGES;
  }

  return packages.map((pkg) => {
    if (typeof pkg === "string") {
      return { pattern: pkg };
    }
    return pkg;
  });
}

function findMatchingConfig(
  packageName: string,
  configs: PackageConfig[]
): PackageConfig | null {
  for (const config of configs) {
    if (matchesPattern(packageName, config.pattern)) {
      return config;
    }
  }
  return null;
}

function matchesPattern(packageName: string, pattern: string): boolean {
  if (!pattern.includes("*")) {
    return packageName === pattern;
  }

  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "{{GLOBSTAR}}")
    .replace(/\*/g, "[^/]*")
    .replace(/{{GLOBSTAR}}/g, ".*");

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(packageName);
}
