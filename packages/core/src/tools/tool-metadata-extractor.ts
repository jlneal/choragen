/**
 * ToolMetadataExtractor
 *
 * Extracts tool metadata from tool definitions and persists to .choragen/tools
 *
 * Design doc: docs/design/core/features/role-based-tool-access.md
 */

// ADR: ADR-010-agent-runtime-architecture

import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { ToolCategory, ToolMetadata, ToolParameterSchema } from "../roles/types.js";

interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  parameters: ToolParameterSchema;
  mutates: boolean;
}

export class ToolMetadataExtractor {
  private readonly toolsIndexPath: string;
  private readonly categoriesPath: string;

  constructor(private readonly projectRoot: string) {
    this.toolsIndexPath = path.join(projectRoot, ".choragen/tools/index.yaml");
    this.categoriesPath = path.join(projectRoot, ".choragen/tools/categories.yaml");
  }

  extractFromRegistry(tools: ToolDefinition[]): ToolMetadata[] {
    return tools.map((tool) => ({
      id: tool.name,
      name: humanizeToolName(tool.name),
      description: tool.description,
      category: tool.category,
      parameters: tool.parameters,
      mutates: tool.mutates,
    }));
  }

  async writeIndex(metadata: ToolMetadata[]): Promise<void> {
    const dir = path.dirname(this.toolsIndexPath);
    await fs.mkdir(dir, { recursive: true });
    const yaml = serializeToolsYaml(metadata, new Date());
    await fs.writeFile(this.toolsIndexPath, yaml, "utf-8");
  }

  async readIndex(): Promise<ToolMetadata[]> {
    try {
      const content = await fs.readFile(this.toolsIndexPath, "utf-8");
      return parseToolsYaml(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  async sync(tools: ToolDefinition[]): Promise<void> {
    const metadata = this.extractFromRegistry(tools);
    await this.writeIndex(metadata);
  }

  async writeCategories(categories: ToolCategory[]): Promise<void> {
    const dir = path.dirname(this.categoriesPath);
    await fs.mkdir(dir, { recursive: true });
    const yaml = serializeCategoriesYaml(categories);
    await fs.writeFile(this.categoriesPath, yaml, "utf-8");
  }

  async readCategories(): Promise<ToolCategory[]> {
    try {
      const content = await fs.readFile(this.categoriesPath, "utf-8");
      return parseCategoriesYaml(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }
}

function humanizeToolName(id: string): string {
  const words = id
    .replace(/[:_]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function serializeToolsYaml(metadata: ToolMetadata[], generatedAt: Date): string {
  const lines: string[] = [];
  lines.push(`generatedAt: ${generatedAt.toISOString()}`);
  lines.push("tools:");

  metadata.forEach((tool, index) => {
    lines.push(`  - id: ${tool.id}`);
    lines.push(`    name: ${tool.name}`);
    lines.push(`    description: ${tool.description}`);
    lines.push(`    category: ${tool.category}`);
    lines.push(`    mutates: ${tool.mutates ? "true" : "false"}`);
    lines.push("    parameters:");
    const params = serializeObject(tool.parameters, 6);
    params.forEach((line) => lines.push(line));

    if (index < metadata.length - 1) {
      lines.push("");
    }
  });

  return lines.join("\n");
}

function parseToolsYaml(content: string): ToolMetadata[] {
  const tools: ToolMetadata[] = [];
  const lines = content.split("\n");
  let current: Partial<ToolMetadata> | null = null;
  let inParameters = false;
  let parameterLines: string[] = [];

  for (const rawLine of lines) {
    if (rawLine.trim() === "" || rawLine.trim().startsWith("#")) continue;

    const indent = rawLine.search(/\S/);
    const trimmed = rawLine.trim();

    if (indent === 0 && trimmed.startsWith("generatedAt:")) {
      continue;
    }

    if (indent === 0 && trimmed === "tools:") {
      continue;
    }

    if (indent === 2 && trimmed.startsWith("- ")) {
      if (current) {
        if (parameterLines.length > 0) {
          current.parameters = parseObject(parameterLines);
        }
        tools.push(finalizeTool(current));
      }
      current = {};
      inParameters = false;
      parameterLines = [];

      const rest = trimmed.slice(2).trim();
      if (rest) {
        const [key, value] = splitKeyValue(rest);
        assignToolProp(current, key, value);
      }
      continue;
    }

    if (!current) continue;

    if (indent === 4 && trimmed.startsWith("parameters:")) {
      inParameters = true;
      parameterLines = [];
      continue;
    }

    if (inParameters && indent >= 6) {
      parameterLines.push(rawLine.slice(6));
      continue;
    }

    if (indent === 4) {
      const [key, value] = splitKeyValue(trimmed);
      assignToolProp(current, key, value);
      inParameters = false;
      continue;
    }
  }

  if (current) {
    if (parameterLines.length > 0) {
      current.parameters = parseObject(parameterLines);
    }
    tools.push(finalizeTool(current));
  }

  return tools;
}

function serializeCategoriesYaml(categories: ToolCategory[]): string {
  const lines: string[] = [];
  lines.push("categories:");
  categories.forEach((category, index) => {
    lines.push(`  - id: ${category.id}`);
    lines.push(`    name: ${category.name}`);
    if (category.description) {
      lines.push(`    description: ${category.description}`);
    }
    lines.push(`    order: ${category.order}`);

    if (index < categories.length - 1) {
      lines.push("");
    }
  });
  return lines.join("\n");
}

function parseCategoriesYaml(content: string): ToolCategory[] {
  const categories: ToolCategory[] = [];
  const lines = content.split("\n");
  let current: Partial<ToolCategory> | null = null;

  for (const rawLine of lines) {
    if (rawLine.trim() === "" || rawLine.trim().startsWith("#")) continue;

    const indent = rawLine.search(/\S/);
    const trimmed = rawLine.trim();

    if (indent === 0 && trimmed === "categories:") continue;

    if (indent === 2 && trimmed.startsWith("- ")) {
      if (current) {
        categories.push(finalizeCategory(current));
      }
      current = {};
      const rest = trimmed.slice(2).trim();
      if (rest) {
        const [key, value] = splitKeyValue(rest);
        assignCategoryProp(current, key, value);
      }
      continue;
    }

    if (!current) continue;

    if (indent === 4) {
      const [key, value] = splitKeyValue(trimmed);
      assignCategoryProp(current, key, value);
      continue;
    }
  }

  if (current) {
    categories.push(finalizeCategory(current));
  }

  return categories;
}

function assignToolProp(target: Partial<ToolMetadata>, key: string, value: string): void {
  if (key === "id") target.id = value;
  if (key === "name") target.name = value;
  if (key === "description") target.description = value;
  if (key === "category") target.category = value;
  if (key === "mutates") target.mutates = value === "true";
}

function finalizeTool(partial: Partial<ToolMetadata>): ToolMetadata {
  return {
    id: partial.id ?? "",
    name: partial.name ?? "",
    description: partial.description ?? "",
    category: partial.category ?? "",
    mutates: partial.mutates ?? false,
    parameters:
      (partial.parameters as ToolParameterSchema) ?? {
        type: "object",
        properties: {},
      },
  };
}

function assignCategoryProp(target: Partial<ToolCategory>, key: string, value: string): void {
  if (key === "id") target.id = value;
  if (key === "name") target.name = value;
  if (key === "description") target.description = value;
  if (key === "order") target.order = Number(value);
}

function finalizeCategory(partial: Partial<ToolCategory>): ToolCategory {
  return {
    id: partial.id ?? "",
    name: partial.name ?? "",
    description: partial.description,
    order: partial.order ?? 0,
  };
}

function splitKeyValue(line: string): [string, string] {
  const idx = line.indexOf(":");
  if (idx === -1) return [line.trim(), ""];
  return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
}

function serializeObject(value: unknown, indent: number): string[] {
  const json = JSON.stringify(value, null, 2);
  return json.split("\n").map((line) => `${" ".repeat(indent)}${line}`);
}

function parseObject(lines: string[]): ToolParameterSchema {
  const jsonLike = lines.map((line) => line.trim()).join("\n");
  try {
    return JSON.parse(jsonLike) as ToolParameterSchema;
  } catch {
    // Fallback: treat as empty object to avoid crash
    return { type: "object", properties: {} };
  }
}
