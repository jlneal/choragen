// ADR: ADR-003-cli-structure

/**
 * Request close command - close a CR/FR by populating commits and moving to done
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { validateRequestForClosure } from "./request-validate.js";

export interface CloseRequestResult {
  success: boolean;
  id?: string;
  filePath?: string;
  commits?: string[];
  error?: string;
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getDateFormatted(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Find request file in todo/ or doing/ directories
 */
async function findRequestFile(
  projectRoot: string,
  requestId: string
): Promise<{ path: string; type: "cr" | "fr" } | null> {
  const requestTypes = [
    { type: "cr" as const, dir: "docs/requests/change-requests" },
    { type: "fr" as const, dir: "docs/requests/fix-requests" },
  ];
  const statusDirs = ["todo", "doing"];

  for (const { type, dir } of requestTypes) {
    for (const status of statusDirs) {
      const searchDir = path.join(projectRoot, dir, status);
      try {
        const files = await fs.readdir(searchDir);
        for (const file of files) {
          if (file.startsWith(requestId) && file.endsWith(".md")) {
            return { path: path.join(searchDir, file), type };
          }
        }
      } catch {
        // Directory doesn't exist, continue
      }
    }
  }

  return null;
}

/**
 * Check if request is already in done/
 */
async function isRequestClosed(
  projectRoot: string,
  requestId: string
): Promise<boolean> {
  const requestDirs = [
    "docs/requests/change-requests/done",
    "docs/requests/fix-requests/done",
  ];

  for (const dir of requestDirs) {
    const searchDir = path.join(projectRoot, dir);
    try {
      const files = await fs.readdir(searchDir);
      for (const file of files) {
        if (file.startsWith(requestId) && file.endsWith(".md")) {
          return true;
        }
      }
    } catch {
      // Directory doesn't exist, continue
    }
  }

  return false;
}

/**
 * Query git log for commits referencing the request ID
 */
function getCommitsForRequest(projectRoot: string, requestId: string): string[] {
  try {
    const output = execSync(`git log --oneline --grep="${requestId}"`, {
      cwd: projectRoot,
      encoding: "utf-8",
    });
    return output
      .trim()
      .split("\n")
      .filter((line) => line.length > 0);
  } catch {
    return [];
  }
}

/**
 * Update the ## Commits section in the request file
 */
function updateCommitsSection(content: string, commits: string[]): string {
  const commitList = commits.map((c) => `- ${c}`).join("\n");
  const commitsSection = `## Commits\n\n${commitList}`;

  // Check if ## Commits section exists
  if (content.includes("## Commits")) {
    // Replace existing section (up to next ## or end of file)
    return content.replace(
      /## Commits[\s\S]*?(?=\n## |\n*$)/,
      commitsSection + "\n"
    );
  } else {
    // Add before ## Notes or at end
    if (content.includes("## Notes")) {
      return content.replace("## Notes", `${commitsSection}\n\n## Notes`);
    } else {
      return content.trimEnd() + "\n\n" + commitsSection + "\n";
    }
  }
}

/**
 * Close a request (CR or FR)
 * - Find request file in todo/ or doing/
 * - Query git log for commits
 * - Populate ## Commits section
 * - Update status to done
 * - Move file to done/
 */
export async function closeRequest(
  projectRoot: string,
  requestId: string,
  options?: { force?: boolean }
): Promise<CloseRequestResult> {
  // Check if already closed
  if (await isRequestClosed(projectRoot, requestId)) {
    return {
      success: false,
      error: `Request already closed: ${requestId}`,
    };
  }

  // Find the request file
  const found = await findRequestFile(projectRoot, requestId);
  if (!found) {
    return {
      success: false,
      error: `Request not found: ${requestId}`,
    };
  }

  if (!options?.force) {
    const validation = await validateRequestForClosure(projectRoot, requestId);
    if (!validation.valid) {
      const errorList = validation.errors.map((message) => `- ${message}`).join("\n");
      return {
        success: false,
        error: `Validation failed:\n${errorList}`,
      };
    }
  }

  // Get commits for this request
  const commits = getCommitsForRequest(projectRoot, requestId);
  if (commits.length === 0) {
    return {
      success: false,
      error: `No commits found for ${requestId}. Commit your work first.`,
    };
  }

  // Read and update content
  let content = await fs.readFile(found.path, "utf-8");
  const dateFormatted = getDateFormatted();

  // Update status to done
  content = content.replace(/\*\*Status\*\*:\s*\w+/, "**Status**: done");

  // Add completion date if not present
  if (!content.includes("**Completed**:")) {
    content = content.replace(
      /(\*\*Created\*\*:[^\n]+)/,
      `$1\n**Completed**: ${dateFormatted}`
    );
  }

  // Update commits section
  content = updateCommitsSection(content, commits);

  // Determine destination directory
  const fileName = path.basename(found.path);
  const baseDir = path.dirname(path.dirname(found.path)); // Go up from todo/doing to base
  const doneDir = path.join(baseDir, "done");

  // Ensure done directory exists
  await fs.mkdir(doneDir, { recursive: true });

  // Write to done and remove from source
  const destPath = path.join(doneDir, fileName);
  await fs.writeFile(destPath, content, "utf-8");
  await fs.unlink(found.path);

  return {
    success: true,
    id: requestId,
    filePath: path.relative(projectRoot, destPath),
    commits,
  };
}
