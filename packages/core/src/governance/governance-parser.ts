/**
 * Governance schema parser
 *
 * Parses choragen.governance.yaml files into GovernanceSchema objects.
 *
 * ADR: ADR-002-governance-schema
 */

import * as fs from "node:fs/promises";
import type {
  GovernanceSchema,
  MutationRule,
  MutationAction,
  RoleGovernanceRules,
} from "./types.js";
import { DEFAULT_GOVERNANCE_SCHEMA } from "./types.js";

/** Raw YAML structure (before normalization) */
interface RawGovernanceYaml {
  mutations?: {
    allow?: RawMutationRule[];
    approve?: RawMutationRule[];
    deny?: RawMutationRule[];
  };
  collision_detection?: {
    strategy?: string;
    on_collision?: string;
  };
  roles?: {
    impl?: RawRoleRules;
    control?: RawRoleRules;
  };
}

interface RawRoleRules {
  allow?: RawMutationRule[];
  deny?: RawMutationRule[];
}

interface RawMutationRule {
  pattern: string;
  actions?: string[];
  reason?: string;
}

const ALL_ACTIONS: MutationAction[] = ["create", "modify", "delete"];

/**
 * Parse a governance YAML file
 */
export async function parseGovernanceFile(
  filePath: string
): Promise<GovernanceSchema> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return parseGovernanceYaml(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      // File doesn't exist, return default permissive schema
      return DEFAULT_GOVERNANCE_SCHEMA;
    }
    throw error;
  }
}

/**
 * Parse governance YAML content
 */
export function parseGovernanceYaml(content: string): GovernanceSchema {
  // Simple YAML parser for our specific format
  const raw = parseSimpleYaml(content) as RawGovernanceYaml;

  return normalizeSchema(raw);
}

/**
 * Normalize raw YAML into GovernanceSchema
 */
function normalizeSchema(raw: RawGovernanceYaml): GovernanceSchema {
  const schema: GovernanceSchema = {
    mutations: {
      allow: [],
      approve: [],
      deny: [],
    },
  };

  if (raw.mutations) {
    if (raw.mutations.allow) {
      schema.mutations.allow = raw.mutations.allow.map(normalizeRule);
    }
    if (raw.mutations.approve) {
      schema.mutations.approve = raw.mutations.approve.map(normalizeRule);
    }
    if (raw.mutations.deny) {
      schema.mutations.deny = raw.mutations.deny.map(normalizeRule);
    }
  }

  if (raw.collision_detection) {
    schema.collisionDetection = {
      strategy:
        raw.collision_detection.strategy === "directory-lock"
          ? "directory-lock"
          : "file-lock",
      onCollision:
        raw.collision_detection.on_collision === "warn" ? "warn" : "block",
    };
  }

  if (raw.roles) {
    schema.roles = {};
    if (raw.roles.impl) {
      schema.roles.impl = normalizeRoleRules(raw.roles.impl);
    }
    if (raw.roles.control) {
      schema.roles.control = normalizeRoleRules(raw.roles.control);
    }
  }

  return schema;
}

/**
 * Normalize raw role rules into RoleGovernanceRules
 */
function normalizeRoleRules(raw: RawRoleRules): RoleGovernanceRules {
  return {
    allow: raw.allow ? raw.allow.map(normalizeRule) : [],
    deny: raw.deny ? raw.deny.map(normalizeRule) : [],
  };
}

/**
 * Normalize a raw rule into MutationRule
 */
function normalizeRule(raw: RawMutationRule): MutationRule {
  return {
    pattern: raw.pattern,
    actions: raw.actions
      ? (raw.actions.filter((a) =>
          ALL_ACTIONS.includes(a as MutationAction)
        ) as MutationAction[])
      : ALL_ACTIONS,
    reason: raw.reason,
  };
}

/**
 * Simple YAML parser for our governance format
 * Handles basic nested structures with arrays, including 3-level nesting for roles
 */
function parseSimpleYaml(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = content.split("\n");

  let currentSection: string | null = null;
  let currentSubsection: string | null = null;
  let currentThirdLevel: string | null = null;
  let currentArray: Record<string, unknown>[] | null = null;
  let currentItem: Record<string, unknown> | null = null;

  for (const rawLine of lines) {
    // Skip comments and empty lines
    if (rawLine.trim().startsWith("#") || rawLine.trim() === "") continue;

    const line = rawLine;
    const indent = line.search(/\S/);
    const trimmed = line.trim();

    // Top-level key (no indent)
    if (indent === 0 && trimmed.endsWith(":")) {
      currentSection = trimmed.slice(0, -1);
      result[currentSection] = {};
      currentSubsection = null;
      currentThirdLevel = null;
      currentArray = null;
      currentItem = null;
      continue;
    }

    // Second-level key (2 spaces)
    if (indent === 2 && trimmed.endsWith(":") && currentSection) {
      currentSubsection = trimmed.slice(0, -1);
      const section = result[currentSection] as Record<string, unknown>;

      // For 'roles' section, subsections (impl/control) are objects, not arrays
      if (currentSection === "roles") {
        section[currentSubsection] = {};
        currentThirdLevel = null;
        currentArray = null;
      } else {
        section[currentSubsection] = [];
        currentArray = section[currentSubsection] as Record<string, unknown>[];
      }
      currentItem = null;
      continue;
    }

    // Third-level key (4 spaces) - for roles section
    if (
      indent === 4 &&
      trimmed.endsWith(":") &&
      currentSection === "roles" &&
      currentSubsection
    ) {
      currentThirdLevel = trimmed.slice(0, -1);
      const section = result[currentSection] as Record<string, unknown>;
      const subsection = section[currentSubsection] as Record<string, unknown>;
      subsection[currentThirdLevel] = [];
      currentArray = subsection[currentThirdLevel] as Record<string, unknown>[];
      currentItem = null;
      continue;
    }

    // Array item start (4 spaces for mutations, 6 spaces for roles)
    const arrayIndent = currentSection === "roles" ? 6 : 4;
    if (indent === arrayIndent && trimmed.startsWith("- ") && currentArray) {
      currentItem = {};
      currentArray.push(currentItem);

      // Parse the first property on the same line
      const firstProp = trimmed.slice(2);
      if (firstProp.includes(":")) {
        const colonIdx = firstProp.indexOf(":");
        const key = firstProp.slice(0, colonIdx).trim();
        let value: unknown = firstProp.slice(colonIdx + 1).trim();

        // Handle quoted strings
        if (
          (value as string).startsWith('"') &&
          (value as string).endsWith('"')
        ) {
          value = (value as string).slice(1, -1);
        }

        currentItem[key] = value;
      }
      continue;
    }

    // Array item continuation (6 spaces for mutations, 8 spaces for roles)
    const continuationIndent = currentSection === "roles" ? 8 : 6;
    if (indent === continuationIndent && currentItem) {
      if (trimmed.includes(":")) {
        const colonIdx = trimmed.indexOf(":");
        const key = trimmed.slice(0, colonIdx).trim();
        let value: unknown = trimmed.slice(colonIdx + 1).trim();

        // Handle arrays like [create, modify]
        if (
          (value as string).startsWith("[") &&
          (value as string).endsWith("]")
        ) {
          value = (value as string)
            .slice(1, -1)
            .split(",")
            .map((s) => s.trim());
        }
        // Handle quoted strings
        else if (
          (value as string).startsWith('"') &&
          (value as string).endsWith('"')
        ) {
          value = (value as string).slice(1, -1);
        }

        currentItem[key] = value;
      }
      continue;
    }
  }

  return result;
}

/**
 * Serialize a GovernanceSchema to YAML
 */
export function serializeGovernanceYaml(schema: GovernanceSchema): string {
  const lines: string[] = [];

  lines.push("# Choragen Governance Schema");
  lines.push("");
  lines.push("mutations:");

  // Allow rules
  if (schema.mutations.allow.length > 0) {
    lines.push("  allow:");
    for (const rule of schema.mutations.allow) {
      lines.push(`    - pattern: "${rule.pattern}"`);
      lines.push(`      actions: [${rule.actions.join(", ")}]`);
      if (rule.reason) {
        lines.push(`      reason: "${rule.reason}"`);
      }
    }
  }

  // Approve rules
  if (schema.mutations.approve.length > 0) {
    lines.push("  approve:");
    for (const rule of schema.mutations.approve) {
      lines.push(`    - pattern: "${rule.pattern}"`);
      lines.push(`      actions: [${rule.actions.join(", ")}]`);
      if (rule.reason) {
        lines.push(`      reason: "${rule.reason}"`);
      }
    }
  }

  // Deny rules
  if (schema.mutations.deny.length > 0) {
    lines.push("  deny:");
    for (const rule of schema.mutations.deny) {
      lines.push(`    - pattern: "${rule.pattern}"`);
      if (rule.reason) {
        lines.push(`      reason: "${rule.reason}"`);
      }
    }
  }

  // Collision detection
  if (schema.collisionDetection) {
    lines.push("");
    lines.push("collision_detection:");
    lines.push(`  strategy: "${schema.collisionDetection.strategy}"`);
    lines.push(`  on_collision: "${schema.collisionDetection.onCollision}"`);
  }

  lines.push("");
  return lines.join("\n");
}
