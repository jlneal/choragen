/**
 * @design-doc docs/design/core/features/role-based-tool-access.md
 * @user-intent "Validate role, tool metadata, and category types along with default categories"
 * @test-type unit
 */

import { describe, expect, it } from "vitest";
import type {
  Role,
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
      createdAt: new Date("2025-12-11T00:00:00Z"),
      updatedAt: new Date("2025-12-12T00:00:00Z"),
    };

    expect(role.toolIds).toContain("read_file");
    expect(role.createdAt).toBeInstanceOf(Date);
    expect(role.updatedAt).toBeInstanceOf(Date);
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
