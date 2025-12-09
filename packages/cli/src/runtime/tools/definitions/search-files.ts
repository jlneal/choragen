// ADR: ADR-010-agent-runtime-architecture

import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { ToolDefinition } from "../types.js";
import type { ToolResult, ExecutionContext } from "../executor.js";

/**
 * Search for text in files (grep-like functionality).
 * Available to both control and impl roles.
 */
export const searchFilesTool: ToolDefinition = {
  name: "search_files",
  description:
    "Search for text in files. Supports regex patterns. Returns matching lines with file paths and line numbers.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query (regex supported)",
      },
      path: {
        type: "string",
        description: "Directory to search in (default: project root)",
      },
      include: {
        type: "string",
        description: "Glob pattern for files to include (e.g., '*.ts')",
      },
      exclude: {
        type: "string",
        description: "Glob pattern for files to exclude (e.g., 'node_modules/*')",
      },
    },
    required: ["query"],
  },
  allowedRoles: ["control", "impl"],
};

/** Maximum number of matches to return */
const MAX_MATCHES = 100;

/** Maximum file size to search (10MB) */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * A single search match.
 */
interface SearchMatch {
  file: string;
  line: number;
  content: string;
}

/**
 * Simple glob pattern matching.
 * Supports * (any characters) and ? (single character).
 */
function matchesGlob(filepath: string, pattern: string): boolean {
  // Convert glob to regex
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape special regex chars
    .replace(/\*\*/g, "{{GLOBSTAR}}") // Temporarily replace **
    .replace(/\*/g, "[^/]*") // * matches any characters except /
    .replace(/\?/g, ".") // ? matches single character
    .replace(/{{GLOBSTAR}}/g, ".*"); // ** matches any characters including /
  
  const regex = new RegExp(`^${regexPattern}$`, "i");
  return regex.test(filepath);
}

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
 * Search a single file for matches.
 */
async function searchFile(
  filePath: string,
  relativePath: string,
  regex: RegExp,
  maxMatches: number
): Promise<SearchMatch[]> {
  const matches: SearchMatch[] = [];
  
  try {
    // Check file size
    const stats = await fs.stat(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      return matches;
    }
    
    // Skip binary files
    if (await isBinaryFile(filePath)) {
      return matches;
    }
    
    // Read and search
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");
    
    for (let i = 0; i < lines.length && matches.length < maxMatches; i++) {
      if (regex.test(lines[i])) {
        matches.push({
          file: relativePath,
          line: i + 1,
          content: lines[i].substring(0, 200), // Truncate long lines
        });
      }
    }
  } catch {
    // Skip files that can't be read
  }
  
  return matches;
}

/**
 * Recursively find all files in a directory.
 */
async function findFiles(
  dirPath: string,
  basePath: string,
  include?: string,
  exclude?: string
): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      const relativePath = path.relative(basePath, fullPath);
      
      // Check exclude pattern
      if (exclude && matchesGlob(relativePath, exclude)) {
        continue;
      }
      
      // Skip common non-searchable directories
      if (item.isDirectory()) {
        if (["node_modules", ".git", "dist", "build", "coverage"].includes(item.name)) {
          continue;
        }
        const subFiles = await findFiles(fullPath, basePath, include, exclude);
        files.push(...subFiles);
      } else if (item.isFile()) {
        // Check include pattern
        if (include && !matchesGlob(item.name, include)) {
          continue;
        }
        files.push(fullPath);
      }
    }
  } catch {
    // Directory might not be readable
  }
  
  return files;
}

/**
 * Execute search_files tool.
 * Searches file contents for matching text.
 */
export async function executeSearchFiles(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const query = params.query as string;
  const searchPath = (params.path as string) || ".";
  const include = params.include as string | undefined;
  const exclude = params.exclude as string | undefined;

  if (!query) {
    return {
      success: false,
      error: "Missing required parameter: query",
    };
  }

  // Compile regex
  let regex: RegExp;
  try {
    regex = new RegExp(query, "i");
  } catch (err) {
    return {
      success: false,
      error: `Invalid regex pattern: ${(err as Error).message}`,
    };
  }

  // Resolve path relative to workspace root
  const absolutePath = path.isAbsolute(searchPath)
    ? searchPath
    : path.join(context.workspaceRoot, searchPath);

  // Check if path exists
  try {
    const stats = await fs.stat(absolutePath);
    if (!stats.isDirectory()) {
      return {
        success: false,
        error: `Path is not a directory: ${searchPath}`,
      };
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        success: false,
        error: `Directory not found: ${searchPath}`,
      };
    }
    throw err;
  }

  // Find all files to search
  const files = await findFiles(absolutePath, absolutePath, include, exclude);
  
  // Search files
  const matches: SearchMatch[] = [];
  let truncated = false;
  
  for (const file of files) {
    if (matches.length >= MAX_MATCHES) {
      truncated = true;
      break;
    }
    
    const relativePath = path.relative(absolutePath, file);
    const fileMatches = await searchFile(
      file,
      relativePath,
      regex,
      MAX_MATCHES - matches.length
    );
    matches.push(...fileMatches);
    
    // Check if we hit the limit after adding matches
    if (matches.length >= MAX_MATCHES) {
      truncated = true;
    }
  }

  return {
    success: true,
    data: {
      query,
      matches,
      totalMatches: matches.length,
      truncated,
    },
  };
}
