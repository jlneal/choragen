/**
 * Rule: require-chain-design-dependency
 *
 * Enforces that implementation chains link to a design chain or explicitly
 * justify skipping design dependencies.
 *
 * ADR: ADR-002-governance-schema
 * ADR: ADR-006-chain-type-system
 * CR: CR-20251214-006
 */

import type { Rule } from "eslint";

interface RuleOptions {
  chainManagerIdentifiers?: string[];
}

type ObjectExpression = any;
type Property = any;

const DEFAULT_CHAIN_MANAGER_IDENTIFIERS = ["ChainManager", "chainManager"];

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require implementation chains to declare a design dependency or justify skipping it",
      category: "Traceability",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          chainManagerIdentifiers: {
            type: "array",
            items: { type: "string" },
            description:
              "Identifier names that manage chain creation (e.g., ChainManager)",
            default: DEFAULT_CHAIN_MANAGER_IDENTIFIERS,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingDesignDependency:
        "Implementation chain must have either:\n  - 'dependsOn' referencing a design chain, OR\n  - 'skipDesign: true' with 'skipDesignJustification' explaining why",
    },
  },

  create(context) {
    const options = (context.options[0] || {}) as RuleOptions;
    const chainManagerIdentifiers =
      options.chainManagerIdentifiers ?? DEFAULT_CHAIN_MANAGER_IDENTIFIERS;

    return {
      CallExpression(node: any) {
        const optionsNode = extractChainOptions(node, chainManagerIdentifiers);
        if (!optionsNode) {
          return;
        }

        const chainType = getStringLiteral(optionsNode, "type");
        if (chainType !== "implementation") {
          return;
        }

        const dependsOn = hasProperty(optionsNode, "dependsOn");
        const skipDesign = getBooleanLiteral(optionsNode, "skipDesign");
        const skipDesignJustification = getStringLiteral(
          optionsNode,
          "skipDesignJustification"
        );

        const hasSkipDesign = skipDesign === true && !!skipDesignJustification;

        if (!dependsOn && !hasSkipDesign) {
          context.report({
            node,
            messageId: "missingDesignDependency",
          });
        }
      },
    };
  },
};

export default rule;

function extractChainOptions(
  node: any,
  chainManagerIdentifiers: string[]
): ObjectExpression | null {
  if (!node || node.type !== "CallExpression") {
    return null;
  }

  const callee = node.callee;
  if (callee?.type !== "MemberExpression") {
    return null;
  }

  if (callee.computed) {
    return null;
  }

  const property = callee.property;
  if (property?.type !== "Identifier" || property.name !== "create") {
    return null;
  }

  const object = callee.object;
  if (object?.type !== "Identifier") {
    return null;
  }

  const isChainManagerCall = chainManagerIdentifiers.includes(object.name);
  if (!isChainManagerCall) {
    return null;
  }

  const firstArg = node.arguments?.[0];
  if (!firstArg || firstArg.type !== "ObjectExpression") {
    return null;
  }

  return firstArg;
}

function getProperty(node: ObjectExpression, name: string): Property | null {
  if (!node.properties) {
    return null;
  }

  for (const prop of node.properties) {
    if (prop.type !== "Property") {
      continue;
    }
    if (prop.key.type === "Identifier" && prop.key.name === name) {
      return prop;
    }
    if (
      prop.key.type === "Literal" &&
      typeof prop.key.value === "string" &&
      prop.key.value === name
    ) {
      return prop;
    }
  }

  return null;
}

function getStringLiteral(node: ObjectExpression, name: string): string | null {
  const prop = getProperty(node, name);
  if (!prop || prop.value?.type !== "Literal") {
    return null;
  }
  return typeof prop.value.value === "string" ? prop.value.value : null;
}

function getBooleanLiteral(
  node: ObjectExpression,
  name: string
): boolean | null {
  const prop = getProperty(node, name);
  if (!prop || prop.value?.type !== "Literal") {
    return null;
  }
  return typeof prop.value.value === "boolean" ? prop.value.value : null;
}

function hasProperty(node: ObjectExpression, name: string): boolean {
  return Boolean(getProperty(node, name));
}
