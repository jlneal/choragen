#!/usr/bin/env node
/**
 * Validate uncommitted request work
 *
 * Detects when completed requests have uncommitted work by checking:
 * 1. If there are uncommitted changes (git status --porcelain)
 * 2. If any done requests have no matching commit in git log
 *
 * ADR: ADR-001-task-file-format
 */

import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const NC = "\x1b[0m";

const projectRoot = process.cwd();

/**
 * Check if there are uncommitted changes
 */
function hasUncommittedChanges() {
  try {
    const output = execSync("git status --porcelain", {
      encoding: "utf-8",
      cwd: projectRoot,
    });
    return output.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Get done requests with their IDs and titles
 */
function getDoneRequests() {
  const requests = [];

  const crDoneDir = join(projectRoot, "docs/requests/change-requests/done");
  const frDoneDir = join(projectRoot, "docs/requests/fix-requests/done");

  for (const dir of [crDoneDir, frDoneDir]) {
    if (!existsSync(dir)) continue;

    const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const filePath = join(dir, file);
      const content = readFileSync(filePath, "utf-8");

      // Extract ID from content (e.g., **ID**: CR-20251207-002)
      const idMatch = content.match(/\*\*ID\*\*:\s*((?:CR|FR)-\d{8}-\d{3})/);
      if (!idMatch) continue;

      const id = idMatch[1];

      // Extract title from first heading
      const titleMatch = content.match(/^#\s+(?:Change|Fix)\s+Request:\s*(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : file.replace(".md", "");

      requests.push({ id, title, file });
    }
  }

  return requests;
}

/**
 * Check if a request ID has a commit in git log
 */
function hasCommitForRequest(requestId) {
  try {
    const output = execSync(`git log --oneline --grep="${requestId}"`, {
      encoding: "utf-8",
      cwd: projectRoot,
    });
    return output.trim().length > 0;
  } catch {
    return false;
  }
}

// Run validation
console.log("🔍 Checking for uncommitted request work...\n");

// Step 1: Check for uncommitted changes
if (!hasUncommittedChanges()) {
  console.log(`${GREEN}✅ No uncommitted changes${NC}`);
  process.exit(0);
}

// Step 2: Get done requests
const doneRequests = getDoneRequests();

if (doneRequests.length === 0) {
  console.log(`${GREEN}✅ No done requests to check${NC}`);
  process.exit(0);
}

// Step 3: Check each done request for a matching commit
const requestsWithoutCommits = [];

for (const request of doneRequests) {
  if (!hasCommitForRequest(request.id)) {
    requestsWithoutCommits.push(request);
  }
}

// Step 4: Report results
if (requestsWithoutCommits.length === 0) {
  console.log(`${GREEN}✅ All done requests have commits${NC}`);
  process.exit(0);
}

console.log(`${YELLOW}⚠️  Uncommitted changes detected with completed requests:${NC}\n`);

for (const request of requestsWithoutCommits) {
  console.log(`  ${request.id}: ${request.title}`);
  console.log(`${DIM}    Status: done (no commit found)${NC}\n`);
}

console.log(`  ${DIM}Recommendation: Commit your changes with proper CR/FR reference${NC}\n`);

console.log(`${RED}❌ Uncommitted request work detected${NC}`);
process.exit(1);
