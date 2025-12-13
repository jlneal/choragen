/**
 * @design-doc docs/design/core/features/role-based-tool-access.md
 * @user-intent "Validate role, tool metadata, and category types along with default categories"
 * @test-type unit
 */

import { describe, expect, it } from "vitest";
import type {
  Role,
  RoleModelConfig,
  ToolCategory,
  ToolMetadata,
  ToolParameterSchema,
} from "../types.js";
import { DEFAULT_TOOL_CATEGORIES } from "../types.js";

describe("roles/types", () => {
  it("defines Role structure", () => {
    const role: Role = {
      id: "researcher",
      name: "Researcher",
      description: "Read-only access for exploration",
      toolIds: ["read_file", "search_files"],
      model: {
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        temperature: 0.5,
        maxTokens: 5000,
        options: { topP: 0.9 },
      },
      systemPrompt: "You are a researcher.",
      createdAt: new Date("2025-12-11T00:00:00Z"),
      updatedAt: new Date("2025-12-12T00:00:00Z"),
    };

    expect(role.toolIds).toContain("read_file");
    expect(role.model?.provider).toBe("anthropic");
    expect(role.systemPrompt).toContain("researcher");
    expect(role.createdAt).toBeInstanceOf(Date);
    expect(role.updatedAt).toBeInstanceOf(Date);
  });

  it("defines RoleModelConfig structure", () => {
    const model: RoleModelConfig = {
      provider: "openai",
      model: "gpt-4.1",
      temperature: 0.3,
      maxTokens: 4000,
      options: { topP: 0.8, frequencyPenalty: 0.2 },
    };

    expect(model.model).toBe("gpt-4.1");
    expect(model.options?.topP).toBe(0.8);
  });

  it("defines ToolMetadata structure", () => {
    const parameters: ToolParameterSchema = {
      type: "object",
      properties: {
        path: { type: "string", description: "File path to read" },
      },
      required: ["path"],
    };

    const metadata: ToolMetadata = {
      id: "read_file",
      name: "Read File",
      description: "Reads the contents of a file",
      category: "filesystem",
      parameters,
      mutates: false,
    };

    expect(metadata.parameters.properties.path.type).toBe("string");
    expect(metadata.mutates).toBe(false);
  });

  it("defines ToolCategory structure and default categories", () => {
    const category: ToolCategory = {
      id: "filesystem",
      name: "Filesystem",
      description: "File operations",
      order: 1,
    };

    expect(category.order).toBe(1);

    const categoryIds = DEFAULT_TOOL_CATEGORIES.map((item) => item.id);
    expect(categoryIds).toEqual([
      "filesystem",
      "search",
      "chain",
      "task",
      "session",
      "command",
    ]);

    const orders = DEFAULT_TOOL_CATEGORIES.map((item) => item.order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
  });
});
