/**
 * @design-doc docs/design/core/features/role-based-tool-access.md
 * @user-intent "CRUD roles with file-based persistence and defaults"
 * @test-type unit
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { RoleManager } from "../role-manager.js";

describe("RoleManager", () => {
  let tempDir: string;
  let manager: RoleManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-roles-"));
    manager = new RoleManager(tempDir);
  });

  it("creates default roles when none exist", async () => {
    await manager.ensureDefaults();

    const roles = await manager.list();
    expect(roles.map((role) => role.id)).toEqual([
      "researcher",
      "implementer",
      "reviewer",
      "controller",
    ]);
    expect(roles.every((role) => role.model === undefined)).toBe(true);
    expect(roles.every((role) => role.systemPrompt === undefined)).toBe(true);
    expect(roles[0].createdAt).toBeInstanceOf(Date);

    const filePath = path.join(tempDir, ".choragen/roles/index.yaml");
    const content = await fs.readFile(filePath, "utf-8");
    expect(content).toContain("roles:");
  });

  it("creates a new role with slugified id and persists to disk", async () => {
    await manager.ensureDefaults();

    const created = await manager.create({
      name: "Support Engineer",
      description: "Handles support tickets",
      toolIds: ["read_file", "task:status"],
    });

    expect(created.id).toBe("support-engineer");
    expect(created.createdAt).toBeInstanceOf(Date);

    const fetched = await manager.get("support-engineer");
    expect(fetched?.name).toBe("Support Engineer");

    const reloaded = new RoleManager(tempDir);
    const listed = await reloaded.list();
    expect(listed.some((role) => role.id === "support-engineer")).toBe(true);
  });

  it("throws when creating a duplicate role id", async () => {
    await manager.ensureDefaults();
    await manager.create({
      name: "Data Analyst",
      toolIds: ["read_file"],
    });

    await expect(
      manager.create({ name: "Data Analyst", toolIds: ["read_file"] })
    ).rejects.toThrow("Role with id 'data-analyst' already exists");
  });

  it("updates an existing role", async () => {
    await manager.ensureDefaults();
    const role = await manager.create({
      name: "Release Manager",
      toolIds: ["task:status"],
    });

    const updated = await manager.update(role.id, {
      name: "Release Captain",
      description: "Coordinates releases",
      toolIds: ["task:status", "chain:status"],
    });

    expect(updated.name).toBe("Release Captain");
    expect(updated.description).toBe("Coordinates releases");
    expect(updated.toolIds).toEqual(["task:status", "chain:status"]);
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(role.createdAt.getTime());
  });

  it("throws when updating a missing role", async () => {
    await manager.ensureDefaults();
    await expect(
      manager.update("unknown", { name: "Missing" })
    ).rejects.toThrow("Role with id 'unknown' not found");
  });

  it("deletes an existing role", async () => {
    await manager.ensureDefaults();
    await manager.create({
      name: "QA",
      toolIds: ["task:status"],
    });

    await manager.delete("qa");
    const roles = await manager.list();
    expect(roles.find((role) => role.id === "qa")).toBeUndefined();
    const fetched = await manager.get("qa");
    expect(fetched).toBeNull();
  });

  it("reads model config and system prompt from YAML", async () => {
    const rolesDir = path.join(tempDir, ".choragen/roles");
    await fs.mkdir(rolesDir, { recursive: true });
    const yaml = `roles:
  - id: control
    name: Control Agent
    description: Coordinates work
    model:
      provider: anthropic
      model: claude-sonnet-4-20250514
      temperature: 0.3
      maxTokens: 4000
      options:
        topP: 0.9
    systemPrompt: |
      First line
      Second line
    toolIds:
      - read_file
      - list_files
    createdAt: 2025-12-12T00:00:00.000Z
    updatedAt: 2025-12-12T01:00:00.000Z
`;
    await fs.writeFile(path.join(rolesDir, "index.yaml"), yaml, "utf-8");

    const role = await manager.get("control");
    expect(role?.model).toEqual({
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      temperature: 0.3,
      maxTokens: 4000,
      options: { topP: 0.9 },
    });
    expect(role?.systemPrompt).toContain("First line");
    expect(role?.toolIds).toEqual(["read_file", "list_files"]);
  });

  it("serializes and reloads model config and system prompt", async () => {
    await manager.ensureDefaults();

    const created = await manager.create({
      name: "Model Tester",
      description: "Ensures model config persists",
      toolIds: ["read_file"],
      model: {
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        temperature: 0.25,
        maxTokens: 1234,
        options: { topP: 0.8 },
      },
      systemPrompt: "file:prompts/model-tester.md",
    });

    const filePath = path.join(tempDir, ".choragen/roles/index.yaml");
    const content = await fs.readFile(filePath, "utf-8");
    expect(content).toContain("provider: anthropic");
    expect(content).toContain("model: claude-sonnet-4-20250514");
    expect(content).toContain("temperature: 0.25");
    expect(content).toContain("maxTokens: 1234");
    expect(content).toContain("systemPrompt: file:prompts/model-tester.md");

    const reloaded = new RoleManager(tempDir);
    const listed = await reloaded.list();
    const role = listed.find((item) => item.id === created.id);
    expect(role?.model).toEqual(created.model);
    expect(role?.systemPrompt).toBe("file:prompts/model-tester.md");
  });

  it("throws when deleting a missing role", async () => {
    await manager.ensureDefaults();
    await expect(manager.delete("nope")).rejects.toThrow(
      "Role with id 'nope' not found"
    );
  });
});
