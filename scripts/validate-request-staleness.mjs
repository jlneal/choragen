#!/usr/bin/env node
/**
 * Validate request staleness
 *
 * Checks that requests (CR/FR) don't become stale in the pipeline:
 * 1. Requests in todo/ older than threshold
 * 2. Requests in doing/ without recent commits
 *
 * This prevents requests from sitting indefinitely without progress.
 *
 * ADR: ADR-001-task-file-format
 */

import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const NC = "\x1b[0m";

const projectRoot = process.cwd();
const REQUESTS_DIR = join(projectRoot, "docs/requests");
const DEFAULT_TODO_THRESHOLD_DAYS = 14;
const DEFAULT_DOING_THRESHOLD_DAYS = 7;

// Time constants
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const MS_PER_DAY =
  HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;

// Check if running in CI environment
const isCI = process.env.CI === "true" || process.env.CI === "1";

// Parse threshold from args (--threshold=N or -t N)
function parseThreshold() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--threshold=")) {
      return parseInt(args[i].split("=")[1], 10);
    }
    if (args[i] === "-t" && args[i + 1]) {
      return parseInt(args[i + 1], 10);
    }
  }
  return null; // Use defaults
}

/**
 * Extract request ID from filename
 * CR-20251129-001-lint-complexity-reduction.md -> CR-20251129-001
 */
function extractRequestId(filename) {
  const match = filename.match(/^((?:CR|FR)-\d{8}-\d{3})/);
  return match ? match[1] : filename.replace(".md", "");
}

/**
 * Extract created date from request file content
 */
function extractCreatedDate(content) {
  const match = content.match(/\*\*Created\*\*:\s*(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/**
 * Get days since last commit mentioning this request ID
 */
function getDaysSinceLastCommit(requestId) {
  try {
    const result = execSync(
      `git log --all --oneline --grep="${requestId}" --format="%ai" -1 2>/dev/null`,
      { encoding: "utf-8", cwd: projectRoot },
    ).trim();

    if (!result) return null;

    const commitDate = new Date(result.split(" ")[0]);
    const now = new Date();
    return Math.floor((now.getTime() - commitDate.getTime()) / MS_PER_DAY);
  } catch {
    return null;
  }
}

/**
 * Scan a request directory for stale requests
 */
function scanDirectory(type, status, threshold) {
  const dirPath = join(REQUESTS_DIR, type, status);
  const staleRequests = [];
  let total = 0;

  if (!existsSync(dirPath)) {
    return { requests: staleRequests, total };
  }

  try {
    const files = readdirSync(dirPath);
    const mdFiles = files.filter(
      (f) => f.endsWith(".md") && !f.startsWith("."),
    );
    total = mdFiles.length;

    for (const file of mdFiles) {
      const filePath = join(dirPath, file);
      if (!statSync(filePath).isFile()) continue;

      const content = readFileSync(filePath, "utf-8");
      const requestId = extractRequestId(file);
      const createdDate = extractCreatedDate(content);

      if (!createdDate) continue;

      const created = new Date(createdDate);
      const now = new Date();
      const daysSinceCreated = Math.floor(
        (now.getTime() - created.getTime()) / MS_PER_DAY,
      );

      // For doing status, also check last commit
      const daysSinceLastCommit =
        status === "doing" ? getDaysSinceLastCommit(requestId) : null;

      // Determine if stale
      let isStale = false;
      let reason = "";

      if (status === "todo" && daysSinceCreated > threshold) {
        isStale = true;
        reason = `In todo/ for ${daysSinceCreated} days (threshold: ${threshold})`;
      } else if (status === "doing") {
        if (daysSinceLastCommit === null && daysSinceCreated > threshold) {
          isStale = true;
          reason = `In doing/ for ${daysSinceCreated} days with no commits`;
        } else if (
          daysSinceLastCommit !== null &&
          daysSinceLastCommit > threshold
        ) {
          isStale = true;
          reason = `Last commit ${daysSinceLastCommit} days ago (threshold: ${threshold})`;
        }
      }

      if (isStale) {
        staleRequests.push({
          id: requestId,
          file: filePath,
          status,
          createdDate,
          daysSinceCreated,
          daysSinceLastCommit,
          threshold,
          reason,
        });
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return { requests: staleRequests, total };
}

/**
 * Validate request staleness across all request directories
 */
function validateRequestStaleness(todoThreshold, doingThreshold) {
  const allStale = [];
  let totalTodo = 0;
  let totalDoing = 0;
  let staleTodo = 0;
  let staleDoing = 0;

  // Scan all directories
  for (const type of ["change-requests", "fix-requests"]) {
    // Check todo
    const todoResult = scanDirectory(type, "todo", todoThreshold);
    totalTodo += todoResult.total;
    staleTodo += todoResult.requests.length;
    allStale.push(...todoResult.requests);

    // Check doing
    const doingResult = scanDirectory(type, "doing", doingThreshold);
    totalDoing += doingResult.total;
    staleDoing += doingResult.requests.length;
    allStale.push(...doingResult.requests);
  }

  // Sort by staleness (most stale first)
  allStale.sort((a, b) => b.daysSinceCreated - a.daysSinceCreated);

  // Generate recommendations
  const recommendations = [];
  for (const req of allStale) {
    if (req.status === "todo") {
      recommendations.push(
        `${req.id}: Move to doing/ and start work, or close if no longer needed`,
      );
    } else {
      recommendations.push(
        `${req.id}: Complete and move to done/, or move back to todo/ if blocked`,
      );
    }
  }

  const success = allStale.length === 0;
  const message = success
    ? `All ${totalTodo + totalDoing} requests are active`
    : `Found ${allStale.length} stale request(s)`;

  return {
    success,
    message,
    staleRequests: allStale,
    stats: {
      totalTodo,
      totalDoing,
      staleTodo,
      staleDoing,
    },
    recommendations,
  };
}

// Main execution
const customThreshold = parseThreshold();
const todoThreshold = customThreshold ?? DEFAULT_TODO_THRESHOLD_DAYS;
const doingThreshold = customThreshold ?? DEFAULT_DOING_THRESHOLD_DAYS;

console.log(`🔍 Validating request staleness...`);
console.log(`   todo/ threshold: ${todoThreshold} days`);
console.log(`   doing/ threshold: ${doingThreshold} days\n`);

const result = validateRequestStaleness(todoThreshold, doingThreshold);

if (result.staleRequests.length > 0) {
  console.log(`${YELLOW}⚠️  Stale requests found:${NC}\n`);

  for (const req of result.staleRequests) {
    const relativePath = relative(projectRoot, req.file);
    console.log(`  ${req.id} (${relativePath})`);
    console.log(`    - ${req.reason}`);
    console.log(`    - Created: ${req.createdDate}`);
    if (req.daysSinceLastCommit !== null) {
      console.log(`    - Days since last commit: ${req.daysSinceLastCommit}`);
    }
    console.log();
  }

  console.log("Recommendations:");
  for (const rec of result.recommendations) {
    console.log(`  - ${rec}`);
  }
  console.log();
}

// Summary
console.log("=".repeat(50));
console.log(`Stats: ${result.stats.totalTodo} todo, ${result.stats.totalDoing} doing`);
console.log(`       ${result.stats.staleTodo} stale todo, ${result.stats.staleDoing} stale doing`);

if (result.success) {
  console.log(`${GREEN}✅ ${result.message}${NC}`);
  process.exit(0);
} else {
  console.log(`${YELLOW}⚠️  ${result.message}${NC}`);

  // In CI, stale requests are blocking
  if (isCI) {
    console.log(`\n${RED}❌ Failing in CI - stale requests must be addressed${NC}`);
    process.exit(1);
  }

  // Locally, just warn
  process.exit(0);
}
