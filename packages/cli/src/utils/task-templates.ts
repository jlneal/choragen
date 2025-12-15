// ADR: ADR-001-task-file-format

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parse as parseYaml } from "yaml";

export interface TaskTemplate {
  name: string;
  type: string;
  defaultPrompt: string;
  description?: string;
  constraints: string[];
  expectedFiles: string[];
}

/**
  * Load a task template from templates/task-templates/<name>.yaml with basic validation.
  */
export async function loadTaskTemplate(projectRoot: string, name: string): Promise<TaskTemplate> {
  const templatePath = path.join(projectRoot, "templates", "task-templates", `${name}.yaml`);

  let raw: string;
  try {
    raw = await fs.readFile(templatePath, "utf-8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new Error(`Task template not found: ${name}`);
    }
    throw new Error(`Failed to read task template ${name}: ${(error as Error).message}`);
  }

  let parsed: unknown;
  try {
    parsed = parseYaml(raw);
  } catch (error) {
    throw new Error(`Failed to parse task template ${name}: ${(error as Error).message}`);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Invalid task template structure for ${name}`);
  }

  const template = parsed as Record<string, unknown>;
  const templateName = typeof template.name === "string" ? template.name : undefined;
  const type = typeof template.type === "string" ? template.type : undefined;
  const defaultPrompt =
    typeof template.defaultPrompt === "string" ? template.defaultPrompt : undefined;
  const description = typeof template.description === "string" ? template.description : undefined;

  const constraints = Array.isArray(template.constraints)
    ? template.constraints.map((c) => String(c))
    : [];
  const expectedFiles = Array.isArray(template.expectedFiles)
    ? template.expectedFiles.map((f) => String(f))
    : [];

  if (!templateName || !type || !defaultPrompt || defaultPrompt.trim().length === 0) {
    throw new Error(`Task template ${name} is missing required fields (name, type, defaultPrompt)`);
  }

  return {
    name: templateName,
    type,
    defaultPrompt,
    description,
    constraints,
    expectedFiles,
  };
}
