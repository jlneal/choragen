// ADR: ADR-010-agent-runtime-architecture

import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { ToolDefinition } from "../types.js";
import type { ToolResult, ExecutionContext } from "../executor.js";

/**
 * Write content to a file. Creates parent directories if needed.
 * Only available to impl role (control cannot write files).
 */
export const writeFileTool: ToolDefinition = {
  name: "write_file",
  description:
    "Write content to a file. Creates parent directories if needed. Use createOnly to fail if file already exists.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path to file (relative to project root)",
      },
      content: {
        type: "string",
        description: "Content to write to the file",
      },
      createOnly: {
        type: "boolean",
        description: "If true, fail if file already exists (default: false)",
      },
    },
    required: ["path", "content"],
  },
  allowedRoles: ["impl"], // Control cannot write files
};

/**
 * Execute write_file tool.
 * Writes content to a file, creating parent directories if needed.
 */
export async function executeWriteFile(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const filePath = params.path as string;
  const content = params.content as string;
  const createOnly = (params.createOnly as boolean) || false;

  if (!filePath) {
    return {
      success: false,
      error: "Missing required parameter: path",
    };
  }

  if (content === undefined || content === null) {
    return {
      success: false,
      error: "Missing required parameter: content",
    };
  }

  // Resolve path relative to workspace root
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(context.workspaceRoot, filePath);

  // Check if file exists
  let fileExists = false;
  try {
    const stats = await fs.stat(absolutePath);
    fileExists = stats.isFile();
    
    // If it's a directory, fail
    if (stats.isDirectory()) {
      return {
        success: false,
        error: `Path is a directory: ${filePath}`,
      };
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
    // File doesn't exist, that's fine
  }

  // Check createOnly constraint
  if (createOnly && fileExists) {
    return {
      success: false,
      error: `File already exists: ${filePath}. Use createOnly: false to overwrite.`,
    };
  }

  // Create parent directories if needed
  const parentDir = path.dirname(absolutePath);
  await fs.mkdir(parentDir, { recursive: true });

  // Write the file
  await fs.writeFile(absolutePath, content, "utf-8");

  // Get file size
  const stats = await fs.stat(absolutePath);

  return {
    success: true,
    data: {
      path: filePath,
      action: fileExists ? "modified" : "created",
      bytes: stats.size,
    },
  };
}
