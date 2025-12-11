/**
 * @design-doc docs/design/core/features/workflow-orchestration.md
 * @user-intent "Ensure workflow templates load from disk with built-in fallbacks and validate structure"
 * @test-type unit
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import {
  loadTemplate,
  listTemplates,
  validateTemplate,
  type WorkflowTemplate,
} from "../templates.js";

describe("workflow templates", () => {
  let tempDir: string;
  let templatesDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "workflow-templates-"));
    templatesDir = path.join(tempDir, ".choragen/workflow-templates");
    await fs.mkdir(templatesDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("loads built-in templates when no local file exists", async () => {
    const template = await loadTemplate(tempDir, "standard");

    expect(template.name).toBe("standard");
    expect(template.stages).toHaveLength(5);
    expect(template.stages[0].gate.type).toBe("human_approval");
    expect(template.stages[3].gate.commands).toEqual(["pnpm build", "pnpm test", "pnpm lint"]);
    expect(template.stages[0].gate.satisfied).toBe(false);
  });

  it("loads a template from .choragen/workflow-templates", async () => {
    const yaml = `
name: custom
stages:
  - name: request
    type: request
    gate:
      type: auto
  - name: verify
    type: verification
    gate:
      type: verification_pass
      commands:
        - "npm test"
`;
    await fs.writeFile(path.join(templatesDir, "custom.yaml"), yaml, "utf-8");

    const template = await loadTemplate(tempDir, "custom");

    expect(template.name).toBe("custom");
    expect(template.stages).toHaveLength(2);
    expect(template.stages[1].gate.commands).toEqual(["npm test"]);
  });

  it("falls back to built-in when local template is missing", async () => {
    const template = await loadTemplate(tempDir, "hotfix");
    expect(template.name).toBe("hotfix");
    expect(template.stages.some((s) => s.type === "design")).toBe(false);
  });

  it("lists built-in and local templates", async () => {
    await fs.writeFile(
      path.join(templatesDir, "doc.yaml"),
      "name: doc\nstages:\n  - name: request\n    type: request\n    gate:\n      type: auto\n",
      "utf-8"
    );

    const names = await listTemplates(tempDir);

    expect(names).toContain("doc");
    expect(names).toContain("standard");
    expect(names).toContain("hotfix");
    expect(names).toContain("documentation");
  });

  it("validates template structure", () => {
    const invalid: WorkflowTemplate = {
      name: "invalid",
      stages: [
        {
          name: "oops",
          type: "request",
          // @ts-expect-error invalid gate type for runtime validation
          gate: { type: "not-a-gate" },
        },
      ],
    };

    expect(() => validateTemplate(invalid)).toThrow("invalid gate type");
  });

  it("requires commands for verification_pass gates", () => {
    const invalid: WorkflowTemplate = {
      name: "verify",
      stages: [
        {
          name: "verify",
          type: "verification",
          gate: { type: "verification_pass" },
        },
      ],
    };

    expect(() => validateTemplate(invalid)).toThrow("requires commands");
  });
});
