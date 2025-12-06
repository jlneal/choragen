/**
 * Rule: require-readonly-properties
 *
 * Encourages readonly properties for immutable data in interfaces and type aliases.
 * Helps enforce immutability patterns and prevent accidental mutations.
 *
 * Blocked:
 *   interface User { name: string; }
 *
 * Allowed:
 *   interface User { readonly name: string; }
 *
 * ADR: ADR-002-governance-schema (code hygiene enforcement)
 */

import type { Rule } from "eslint";
import path from "path";

const DEFAULT_IGNORE_PATTERNS = ["^set", "^update", "^_"];
const DEFAULT_IGNORE_FILES = ["*.test.ts", "*.spec.ts"];

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Require readonly on interface and type alias properties",
      category: "Code Hygiene",
      recommended: false,
    },
    messages: {
      missingReadonly:
        "Property '{{propertyName}}' should be marked as readonly for immutability.",
    },
    schema: [
      {
        type: "object",
        properties: {
          ignorePatterns: {
            type: "array",
            items: { type: "string" },
            default: DEFAULT_IGNORE_PATTERNS,
          },
          ignoreFiles: {
            type: "array",
            items: { type: "string" },
            default: DEFAULT_IGNORE_FILES,
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const filename = context.getFilename();
    const options = (context.options[0] as {
      ignorePatterns?: string[];
      ignoreFiles?: string[];
    }) || {};

    const ignorePatternStrings = options.ignorePatterns || DEFAULT_IGNORE_PATTERNS;
    const ignoreFilePatterns = options.ignoreFiles || DEFAULT_IGNORE_FILES;

    const ignoreNameRegexes = ignorePatternStrings.map(
      (pattern) => new RegExp(pattern)
    );
    const ignoreFileRegexes = ignoreFilePatterns.map(globToRegExp);
    const normalizedFilename = filename.replace(/\\/g, "/");

    if (
      isInTestsDirectory(normalizedFilename) ||
      matchesAnyPattern(normalizedFilename, ignoreFileRegexes)
    ) {
      return {};
    }

    function shouldIgnoreProperty(name: string, isOptional: boolean): boolean {
      if (matchesAnyPattern(name, ignoreNameRegexes)) {
        return true;
      }

      return isOptional && matchesAnyPattern(name, ignoreNameRegexes);
    }

    function reportIfMissingReadonly(member: any): void {
      if (member.readonly) {
        return;
      }

      const propertyName = getPropertyName(member.key);
      if (!propertyName) {
        return;
      }

      if (shouldIgnoreProperty(propertyName, member.optional === true)) {
        return;
      }

      context.report({
        node: member.key,
        messageId: "missingReadonly",
        data: { propertyName },
      });
    }

    function checkMembers(members: any[]): void {
      for (const member of members) {
        if (member.type !== "TSPropertySignature") {
          continue;
        }

        reportIfMissingReadonly(member);
      }
    }

    return {
      TSInterfaceDeclaration(node: any) {
        checkMembers(node.body.body);
      },
      TSTypeAliasDeclaration(node: any) {
        if (node.typeAnnotation.type === "TSTypeLiteral") {
          checkMembers(node.typeAnnotation.members);
        }
      },
    };
  },
};

export default rule;

function matchesAnyPattern(value: string, regexes: RegExp[]): boolean {
  return regexes.some((regex) => regex.test(value));
}

function isInTestsDirectory(filename: string): boolean {
  return (
    filename.includes("/__tests__/") ||
    filename.endsWith("/__tests__") ||
    filename.includes(`${path.sep}__tests__${path.sep}`)
  );
}

function getPropertyName(key: any): string | undefined {
  if (!key) {
    return undefined;
  }

  if (key.type === "Identifier") {
    return key.name;
  }

  if (key.type === "Literal" && typeof key.value === "string") {
    return key.value;
  }

  if (
    key.type === "TemplateLiteral" &&
    key.expressions.length === 0 &&
    key.quasis.length === 1
  ) {
    return key.quasis[0].value.cooked;
  }

  return undefined;
}

function globToRegExp(pattern: string): RegExp {
  const escapedSegments = pattern
    .split("*")
    .map((segment) => escapeRegExp(segment));
  const regexPattern = `^${escapedSegments.join(".*")}$`;
  return new RegExp(regexPattern);
}

function escapeRegExp(text: string): string {
  return text.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&");
}
