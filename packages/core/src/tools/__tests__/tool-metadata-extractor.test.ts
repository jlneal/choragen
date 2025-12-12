/**
 * @design-doc docs/design/core/features/role-based-tool-access.md
 * @user-intent "Extract tool metadata and persist index/categories for UI consumption"
 * @test-type unit
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { ToolMetadataExtractor } from "../tool-metadata-extractor.js";
import type { ToolParameterSchema, ToolCategory } from "../../roles/types.js";

describe("ToolMetadataExtractor", () => {
  let tempDir: string;
  let extractor: ToolMetadataExtractor;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-tools-"));
    extractor = new ToolMetadataExtractor(tempDir);
  });

  it("extracts metadata with humanized names", () => {
    const parameters: ToolParameterSchema = {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to file" },
      },
      required: ["path"],
    };

    const tools = [
      {
        name: "read_file",
        description: "Read the contents of a file",
        category: "filesystem",
        parameters,
        mutates: false,
      },
      {
        name: "chain:status",
        description: "Get chain status",
        category: "chain",
        parameters,
        mutates: false,
      },
    ] satisfies Parameters<ToolMetadataExtractor["extractFromRegistry"]>[0];

    const metadata = extractor.extractFromRegistry(tools);

    expect(metadata[0]).toMatchObject({
      id: "read_file",
      name: "Read File",
      category: "filesystem",
      mutates: false,
    });
    expect(metadata[1].name).toBe("Chain Status");
  });

  it("writes and reads tool index", async () => {
    const parameters: ToolParameterSchema = {
      type: "object",
      properties: { query: { type: "string" } },
    };

    const tools = [
      {
        name: "search_files",
        description: "Search files for a pattern",
        category: "search",
        parameters,
        mutates: false,
      },
    ] satisfies Parameters<ToolMetadataExtractor["extractFromRegistry"]>[0];

    const metadata = extractor.extractFromRegistry(tools);
    await extractor.writeIndex(metadata);

    const indexPath = path.join(tempDir, ".choragen/tools/index.yaml");
    const content = await fs.readFile(indexPath, "utf-8");
    expect(content).toContain("generatedAt:");
    expect(content).toContain("id: search_files");
    expect(content).toContain("parameters:");

    const reloaded = await extractor.readIndex();
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0].parameters.type).toBe("object");
    expect(reloaded[0].parameters.properties.query.type).toBe("string");
  });

  it("returns empty array when index file is missing", async () => {
    const result = await extractor.readIndex();
    expect(result).toEqual([]);
  });

  it("sync writes index in a single call", async () => {
    const tools = [
      {
        name: "task:list",
        description: "List tasks",
        category: "task",
        parameters: { type: "object", properties: {} },
        mutates: false,
      },
    ] satisfies Parameters<ToolMetadataExtractor["extractFromRegistry"]>[0];

    await extractor.sync(tools);

    const indexPath = path.join(tempDir, ".choragen/tools/index.yaml");
    const exists = await fileExists(indexPath);
    expect(exists).toBe(true);

    const parsed = await extractor.readIndex();
    expect(parsed[0].name).toBe("Task List");
  });

  it("writes and reads tool categories", async () => {
    const categories: ToolCategory[] = [
      { id: "filesystem", name: "Filesystem", order: 1 },
      { id: "command", name: "Command", description: "Shell commands", order: 2 },
    ];

    await extractor.writeCategories(categories);

    const categoriesPath = path.join(tempDir, ".choragen/tools/categories.yaml");
    const content = await fs.readFile(categoriesPath, "utf-8");
    expect(content).toContain("categories:");
    expect(content).toContain("id: filesystem");

    const reloaded = await extractor.readCategories();
    expect(reloaded).toHaveLength(2);
    expect(reloaded[1].description).toBe("Shell commands");
  });
});

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
