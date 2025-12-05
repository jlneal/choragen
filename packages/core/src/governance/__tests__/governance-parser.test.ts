import { describe, it, expect } from "vitest";
import {
  parseGovernanceYaml,
  serializeGovernanceYaml,
} from "../governance-parser.js";

describe("governance-parser", () => {
  describe("parseGovernanceYaml", () => {
    it("parses basic governance schema", () => {
      const yaml = `
mutations:
  allow:
    - pattern: "components/**/*.tsx"
      actions: [create, modify]
  approve:
    - pattern: "supabase/migrations/*.sql"
      actions: [create, modify]
      reason: "Schema changes require review"
  deny:
    - pattern: "*.key"
`;

      const schema = parseGovernanceYaml(yaml);

      expect(schema.mutations.allow).toHaveLength(1);
      expect(schema.mutations.allow[0].pattern).toBe("components/**/*.tsx");
      expect(schema.mutations.allow[0].actions).toEqual(["create", "modify"]);

      expect(schema.mutations.approve).toHaveLength(1);
      expect(schema.mutations.approve[0].reason).toBe(
        "Schema changes require review"
      );

      expect(schema.mutations.deny).toHaveLength(1);
      expect(schema.mutations.deny[0].pattern).toBe("*.key");
    });

    it("parses collision detection config", () => {
      const yaml = `
mutations:
  allow:
    - pattern: "**/*"
      actions: [create, modify, delete]

collision_detection:
  strategy: "file-lock"
  on_collision: "block"
`;

      const schema = parseGovernanceYaml(yaml);

      expect(schema.collisionDetection).toBeDefined();
      expect(schema.collisionDetection!.strategy).toBe("file-lock");
      expect(schema.collisionDetection!.onCollision).toBe("block");
    });

    it("handles empty sections", () => {
      const yaml = `
mutations:
  allow:
    - pattern: "**/*"
      actions: [create]
`;

      const schema = parseGovernanceYaml(yaml);

      expect(schema.mutations.allow).toHaveLength(1);
      expect(schema.mutations.approve).toHaveLength(0);
      expect(schema.mutations.deny).toHaveLength(0);
    });

    it("ignores comments", () => {
      const yaml = `
# This is a comment
mutations:
  allow:
    # Another comment
    - pattern: "src/**/*"
      actions: [create]
`;

      const schema = parseGovernanceYaml(yaml);
      expect(schema.mutations.allow).toHaveLength(1);
      expect(schema.mutations.allow[0].pattern).toBe("src/**/*");
    });
  });

  describe("serializeGovernanceYaml", () => {
    it("serializes governance schema to YAML", () => {
      const schema = {
        mutations: {
          allow: [{ pattern: "src/**/*", actions: ["create", "modify"] }],
          approve: [
            {
              pattern: "migrations/*.sql",
              actions: ["create"],
              reason: "Needs review",
            },
          ],
          deny: [{ pattern: "*.secret", actions: ["create", "modify", "delete"] }],
        },
      } satisfies import("../types.js").GovernanceSchema;

      const yaml = serializeGovernanceYaml(schema);

      expect(yaml).toContain('pattern: "src/**/*"');
      expect(yaml).toContain("actions: [create, modify]");
      expect(yaml).toContain('reason: "Needs review"');
      expect(yaml).toContain('pattern: "*.secret"');
    });

    it("includes collision detection when present", () => {
      const schema = {
        mutations: {
          allow: [{ pattern: "**/*", actions: ["create"] }],
          approve: [],
          deny: [],
        },
        collisionDetection: {
          strategy: "file-lock",
          onCollision: "block",
        },
      } satisfies import("../types.js").GovernanceSchema;

      const yaml = serializeGovernanceYaml(schema);

      expect(yaml).toContain("collision_detection:");
      expect(yaml).toContain('strategy: "file-lock"');
      expect(yaml).toContain('on_collision: "block"');
    });
  });
});
