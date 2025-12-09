// ADR: ADR-010-agent-runtime-architecture

import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { ToolDefinition } from "../types.js";
import type { ToolResult, ExecutionContext } from "../executor.js";

/**
 * List files and directories at a path.
 * Available to both control and impl roles.
 */
export const listFilesTool: ToolDefinition = {
  name: "list_files",
  description:
    "List files and directories at a path. Supports glob pattern filtering and recursive listing.",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "Directory path (relative to project root)",
      },
      pattern: {
        type: "string",
        description: "Glob pattern to filter results (e.g., '*.ts', '*.md')",
      },
      recursive: {
        type: "boolean",
        description: "Include subdirectories recursively (default: false)",
      },
    },
    required: ["path"],
  },
  allowedRoles: ["control", "impl"],
};

/**
 * Entry in a directory listing.
 */
interface DirectoryEntry {
  name: string;
  type: "file" | "directory";
  size?: number;
  items?: number;
}

/**
 * Simple glob pattern matching.
 * Supports * (any characters) and ? (single character).
 */
function matchesGlob(filename: string, pattern: string): boolean {
  // Convert glob to regex
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape special regex chars
    .replace(/\*/g, ".*") // * matches any characters
    .replace(/\?/g, "."); // ? matches single character
  
  const regex = new RegExp(`^${regexPattern}$`, "i");
  return regex.test(filename);
}

/**
 * Count items in a directory recursively.
 */
async function countItems(dirPath: string): Promise<number> {
  try {
    const entries = await fs.readdir(dirPath);
    return entries.length;
  } catch {
    return 0;
  }
}

/**
 * List directory contents recursively.
 */
async function listRecursive(
  dirPath: string,
  basePath: string,
  pattern?: string
): Promise<DirectoryEntry[]> {
  const entries: DirectoryEntry[] = [];
  
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      const relativePath = path.relative(basePath, fullPath);
      
      if (item.isDirectory()) {
        // Recurse into subdirectory
        const subEntries = await listRecursive(fullPath, basePath, pattern);
        entries.push(...subEntries);
        
        // Also add the directory itself if no pattern or matches
        if (!pattern || matchesGlob(item.name, pattern)) {
          const itemCount = await countItems(fullPath);
          entries.push({
            name: relativePath + "/",
            type: "directory",
            items: itemCount,
          });
        }
      } else if (item.isFile()) {
        // Check pattern match
        if (!pattern || matchesGlob(item.name, pattern)) {
          const stats = await fs.stat(fullPath);
          entries.push({
            name: relativePath,
            type: "file",
            size: stats.size,
          });
        }
      }
    }
  } catch {
    // Directory might not be readable
  }
  
  return entries;
}

/**
 * Execute list_files tool.
 * Lists directory contents with optional filtering.
 */
export async function executeListFiles(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const dirPath = params.path as string;
  const pattern = params.pattern as string | undefined;
  const recursive = (params.recursive as boolean) || false;

  if (!dirPath) {
    return {
      success: false,
      error: "Missing required parameter: path",
    };
  }

  // Resolve path relative to workspace root
  const absolutePath = path.isAbsolute(dirPath)
    ? dirPath
    : path.join(context.workspaceRoot, dirPath);

  // Check if path exists and is a directory
  try {
    const stats = await fs.stat(absolutePath);
    if (!stats.isDirectory()) {
      return {
        success: false,
        error: `Path is not a directory: ${dirPath}`,
      };
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        success: false,
        error: `Directory not found: ${dirPath}`,
      };
    }
    throw err;
  }

  let entries: DirectoryEntry[];

  if (recursive) {
    entries = await listRecursive(absolutePath, absolutePath, pattern);
  } else {
    // Non-recursive listing
    const items = await fs.readdir(absolutePath, { withFileTypes: true });
    entries = [];

    for (const item of items) {
      // Check pattern match
      if (pattern && !matchesGlob(item.name, pattern)) {
        continue;
      }

      const fullPath = path.join(absolutePath, item.name);

      if (item.isDirectory()) {
        const itemCount = await countItems(fullPath);
        entries.push({
          name: item.name + "/",
          type: "directory",
          items: itemCount,
        });
      } else if (item.isFile()) {
        const stats = await fs.stat(fullPath);
        entries.push({
          name: item.name,
          type: "file",
          size: stats.size,
        });
      }
    }
  }

  // Sort entries: directories first, then files, alphabetically
  entries.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return {
    success: true,
    data: {
      path: dirPath,
      entries,
      count: entries.length,
    },
  };
}
