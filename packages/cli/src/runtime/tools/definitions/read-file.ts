// ADR: ADR-010-agent-runtime-architecture

import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { ToolDefinition } from "../types.js";
import type { ToolResult, ExecutionContext } from "../executor.js";

/**
 * Read file contents with optional offset/limit for large files.
 * Available to both control and impl roles.
 */
export const readFileTool: ToolDefinition = {
  name: "read_file",
  description:
    "Read the contents of a file. Returns file contents with line numbers (1-indexed, like cat -n). Use offset and limit for large files.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Path to file (relative to project root)",
      },
      offset: {
        type: "number",
        description: "Line number to start from (1-indexed, default: 1)",
      },
      limit: {
        type: "number",
        description: "Maximum number of lines to return",
      },
    },
    required: ["path"],
  },
  category: "filesystem",
  mutates: false,
};

/**
 * Check if a file appears to be binary.
 * Uses a simple heuristic: check for null bytes in the first chunk.
 */
async function isBinaryFile(filePath: string): Promise<boolean> {
  const SAMPLE_SIZE = 8192;
  const handle = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(SAMPLE_SIZE);
    const { bytesRead } = await handle.read(buffer, 0, SAMPLE_SIZE, 0);
    
    // Check for null bytes (common indicator of binary content)
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) {
        return true;
      }
    }
    return false;
  } finally {
    await handle.close();
  }
}

/**
 * Format line number with padding (like cat -n output).
 * Pads to 6 characters, right-aligned, followed by arrow separator.
 */
function formatLineNumber(lineNum: number): string {
  const LINE_NUMBER_WIDTH = 6;
  return `${lineNum.toString().padStart(LINE_NUMBER_WIDTH)}→`;
}

/**
 * Execute read_file tool.
 * Reads file contents and returns with line numbers.
 */
export async function executeReadFile(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const filePath = params.path as string;
  const offset = (params.offset as number) || 1;
  const limit = params.limit as number | undefined;

  if (!filePath) {
    return {
      success: false,
      error: "Missing required parameter: path",
    };
  }

  // Resolve path relative to workspace root
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(context.workspaceRoot, filePath);

  // Check if file exists
  try {
    const stats = await fs.stat(absolutePath);
    if (!stats.isFile()) {
      return {
        success: false,
        error: `Path is not a file: ${filePath}`,
      };
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        success: false,
        error: `File not found: ${filePath}`,
      };
    }
    throw err;
  }

  // Check for binary file
  try {
    if (await isBinaryFile(absolutePath)) {
      return {
        success: false,
        error: `Cannot read binary file: ${filePath}. Use a different tool for binary files.`,
      };
    }
  } catch {
    // If we can't check, proceed with reading
  }

  // Read file contents
  const content = await fs.readFile(absolutePath, "utf-8");
  const allLines = content.split("\n");
  const totalLines = allLines.length;

  // Apply offset (1-indexed)
  const startIndex = Math.max(0, offset - 1);
  
  // Apply limit
  const endIndex = limit !== undefined
    ? Math.min(startIndex + limit, totalLines)
    : totalLines;

  // Extract requested lines
  const selectedLines = allLines.slice(startIndex, endIndex);

  // Format with line numbers
  const formattedLines = selectedLines.map((line, index) => {
    const lineNum = startIndex + index + 1;
    return `${formatLineNumber(lineNum)}${line}`;
  });

  const formattedContent = formattedLines.join("\n");

  return {
    success: true,
    data: {
      path: filePath,
      content: formattedContent,
      totalLines,
      startLine: startIndex + 1,
      endLine: endIndex,
      linesReturned: selectedLines.length,
    },
  };
}
