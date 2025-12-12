/**
 * @design-doc docs/design/core/features/workflow-template-editor.md
 * @test-type unit
 * @user-intent "Verify TemplateManager CRUD and versioning operations"
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { TemplateManager, type TemplateVersion } from "../template-manager.js";
import type { WorkflowTemplate } from "../templates.js";

const TEMPLATE_META = {
  builtin: false,
  version: 1,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

const baseTemplate = (name: string): WorkflowTemplate => ({
  ...TEMPLATE_META,
  name,
  stages: [
    {
      name: "implement",
      type: "implementation",
      gate: { type: "auto" },
    },
  ],
});

describe("TemplateManager", () => {
  let tempDir: string;
  let manager: TemplateManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "template-manager-"));
    manager = new TemplateManager(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("lists built-in templates alongside custom ones", async () => {
    await manager.create(baseTemplate("custom"), { changedBy: "tester" });

    const templates = await manager.list();

    const names = templates.map((t) => t.name);
    expect(names).toContain("standard");
    expect(names).toContain("custom");
    const standardTemplate = templates.find((t) => t.name === "standard");
    expect(standardTemplate?.builtin).toBe(true);
  });

  it("creates a new template and records version 1", async () => {
    const created = await manager.create(baseTemplate("alpha"), { changedBy: "author", changeDescription: "initial" });

    expect(created.version).toBe(1);
    expect(created.builtin).toBe(false);
    await expect(fs.readFile(path.join(tempDir, ".choragen/workflow-templates/alpha.yaml"), "utf-8")).resolves.toContain("name: \"alpha\"");

    const versions = await manager.listVersions("alpha");
    expect(versions).toHaveLength(1);
    expect(versions[0].version).toBe(1);
    expect(versions[0].changedBy).toBe("author");
    expect(versions[0].snapshot.name).toBe("alpha");
  });

  it("updates a template, increments version, and saves history", async () => {
    await manager.create(baseTemplate("beta"), { changedBy: "creator" });

    const updated = await manager.update(
      "beta",
      {
        description: "Updated workflow",
        stages: [
          {
            name: "implement",
            type: "implementation",
            gate: { type: "verification_pass", commands: ["pnpm test"] },
          },
        ],
      },
      { changedBy: "editor" }
    );

    expect(updated.version).toBe(2);
    expect(updated.description).toBe("Updated workflow");
    expect(updated.stages[0].gate.type).toBe("verification_pass");

    const versions = await manager.listVersions("beta");
    expect(versions.map((v) => v.version)).toEqual([1, 2]);
    expect(versions[1].changedBy).toBe("editor");
  });

  it("prevents deleting built-in templates", async () => {
    await expect(manager.delete("standard")).rejects.toThrow("Built-in template standard cannot be deleted");
  });

  it("duplicates a template into a new custom template", async () => {
    const duplicate = await manager.duplicate("standard", "standard-copy", { changedBy: "cloner" });

    expect(duplicate.name).toBe("standard-copy");
    expect(duplicate.builtin).toBe(false);
    expect(duplicate.version).toBe(1);
    expect(duplicate.stages).not.toHaveLength(0);

    const versions = await manager.listVersions("standard-copy");
    expect(versions[0].changedBy).toBe("cloner");
  });

  it("restores a previous version as the next version", async () => {
    await manager.create(baseTemplate("gamma"), { changedBy: "creator" });
    await manager.update(
      "gamma",
      {
        stages: [
          {
            name: "verify",
            type: "verification",
            gate: { type: "verification_pass", commands: ["pnpm test"] },
          },
        ],
      },
      { changedBy: "editor" }
    );

    const restored = await manager.restoreVersion("gamma", 1, "restorer", "revert to original");

    expect(restored.version).toBe(3);
    expect(restored.stages[0].name).toBe("implement");

    const history = await manager.listVersions("gamma");
    const versionNumbers = history.map((v: TemplateVersion) => v.version);
    expect(versionNumbers).toEqual([1, 2, 3]);
    expect(history[2].changedBy).toBe("restorer");
  });
});
