/**
 * @design-doc docs/design/core/features/workflow-template-editor.md
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
import type { TransitionAction } from "../types.js";

const templateMeta = () => ({
  builtin: false,
  version: 1,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
});

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
    expect(template.displayName).toBe("Standard Workflow");
    expect(template.builtin).toBe(true);
    expect(template.version).toBe(1);
    expect(template.stages).toHaveLength(5);
    expect(template.stages[0].gate.type).toBe("human_approval");
    expect(template.stages[3].gate.commands).toEqual(["pnpm build", "pnpm test", "pnpm lint"]);
    expect(template.stages[0].gate.satisfied).toBe(false);
    expect(template.createdAt).toBeInstanceOf(Date);
    expect(template.updatedAt).toBeInstanceOf(Date);
  });

  it("loads a template from .choragen/workflow-templates", async () => {
    const yaml = `
name: custom
displayName: Custom Workflow
description: Custom template with hooks
builtin: false
version: 3
createdAt: 2024-12-01T00:00:00.000Z
updatedAt: 2024-12-02T00:00:00.000Z
stages:
  - name: request
    type: request
    roleId: control
    gate:
      type: auto
    hooks:
      onEnter:
        - type: command
          command: "echo enter"
  - name: verify
    type: verification
    roleId: impl
    gate:
      type: verification_pass
      commands:
        - "npm test"
    hooks:
      onExit:
        - type: task_transition
          taskTransition: approve
          blocking: false
        - type: file_move
          fileMove:
            from: "draft"
            to: "final"
`;
    await fs.writeFile(path.join(templatesDir, "custom.yaml"), yaml, "utf-8");

    const template = await loadTemplate(tempDir, "custom");

    expect(template.name).toBe("custom");
    expect(template.displayName).toBe("Custom Workflow");
    expect(template.description).toBe("Custom template with hooks");
    expect(template.version).toBe(3);
    expect(template.builtin).toBe(false);
    expect(template.createdAt.toISOString()).toBe("2024-12-01T00:00:00.000Z");
    expect(template.updatedAt.toISOString()).toBe("2024-12-02T00:00:00.000Z");
    expect(template.stages).toHaveLength(2);
    expect(template.stages[1].gate.commands).toEqual(["npm test"]);
    expect(template.stages[0].roleId).toBe("control");
    expect(template.stages[0].hooks?.onEnter?.[0]).toMatchObject({
      type: "command",
      command: "echo enter",
      blocking: true,
    });
    expect(template.stages[1].hooks?.onExit?.[0]).toMatchObject({
      type: "task_transition",
      taskTransition: "approve",
      blocking: false,
    });
    expect(template.stages[1].hooks?.onExit?.[1]).toMatchObject({
      type: "file_move",
      fileMove: { from: "draft", to: "final" },
    });
  });

  it("falls back to built-in when local template is missing", async () => {
    const template = await loadTemplate(tempDir, "hotfix");
    expect(template.name).toBe("hotfix");
    expect(template.builtin).toBe(true);
    expect(template.version).toBe(1);
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
      ...templateMeta(),
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
      ...templateMeta(),
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

  it("validates transition action types", () => {
    const invalidActionTemplate: WorkflowTemplate = {
      ...templateMeta(),
      name: "invalid-action",
      stages: [
        {
          name: "stage",
          type: "request",
          gate: { type: "auto" },
          hooks: {
            onEnter: [{ type: "noop" } as unknown as TransitionAction],
          },
        },
      ],
    };

    expect(() => validateTemplate(invalidActionTemplate)).toThrow("invalid action type");
  });
});
