#!/usr/bin/env node
/**
 * Validate ADR staleness
 *
 * Checks that ADRs in doing/ are not stale:
 * 1. Have been updated within the threshold (default: 14 days), OR
 * 2. Have source files referencing them
 *
 * This prevents ADRs from sitting in doing/ indefinitely without progress.
 *
 * ADR: ADR-001-task-file-format
 */

import { execSync } from "node:child_process";
import { readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const NC = "\x1b[0m";

const projectRoot = process.cwd();
const ADR_DOING_DIR = join(projectRoot, "docs/adr/doing");
const DEFAULT_THRESHOLD_DAYS = 14;

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
  return DEFAULT_THRESHOLD_DAYS;
}

/**
 * Check if source files reference this ADR
 */
function hasSourceReferences(adrPath) {
  const relativePath = relative(projectRoot, adrPath);
  try {
    // Search for references to this ADR in source files
    const result = execSync(
      `grep -r "${relativePath}" --include="*.ts" --include="*.tsx" --include="*.mjs" packages/ scripts/ 2>/dev/null | head -1`,
      { encoding: "utf-8", cwd: projectRoot },
    );
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Get days since file was last modified
 */
function getDaysSinceModified(filePath) {
  const stats = statSync(filePath);
  const now = Date.now();
  const mtime = stats.mtime.getTime();
  return Math.floor((now - mtime) / MS_PER_DAY);
}

/**
 * Check if there are recent commits touching this file
 */
function hasRecentCommits(adrPath, thresholdDays) {
  const relativePath = relative(projectRoot, adrPath);
  try {
    const result = execSync(
      `git log --oneline --since="${thresholdDays} days ago" -- "${relativePath}" 2>/dev/null | head -1`,
      { encoding: "utf-8", cwd: projectRoot },
    );
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Validate ADR staleness
 */
function validateAdrStaleness(thresholdDays) {
  const staleAdrs = [];
  let checkedFiles = 0;

  if (!existsSync(ADR_DOING_DIR)) {
    return { success: true, staleAdrs: [], checkedFiles: 0, activeFiles: 0 };
  }

  try {
    const entries = readdirSync(ADR_DOING_DIR);

    for (const entry of entries) {
      if (!entry.endsWith(".md")) {
        continue;
      }

      const fullPath = join(ADR_DOING_DIR, entry);
      if (!statSync(fullPath).isFile()) {
        continue;
      }

      checkedFiles++;

      const daysSinceModified = getDaysSinceModified(fullPath);
      const hasRefs = hasSourceReferences(fullPath);
      const hasCommits = hasRecentCommits(fullPath, thresholdDays);

      // ADR is stale if:
      // 1. No recent commits (> threshold days)
      // 2. No source files reference it
      if (!hasCommits && !hasRefs) {
        let reason;
        if (daysSinceModified > thresholdDays) {
          reason = `No activity for ${daysSinceModified} days and no source references`;
        } else {
          reason = `No source files reference this ADR yet`;
        }

        staleAdrs.push({
          file: fullPath,
          daysSinceModified,
          hasSourceReferences: hasRefs,
          reason,
        });
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  const activeFiles = checkedFiles - staleAdrs.length;

  return {
    success: staleAdrs.length === 0,
    staleAdrs,
    checkedFiles,
    activeFiles,
  };
}

// Main execution
const thresholdDays = parseThreshold();

console.log(`🔍 Validating ADR staleness (threshold: ${thresholdDays} days)...\n`);

const result = validateAdrStaleness(thresholdDays);

if (result.staleAdrs.length > 0) {
  console.log(`${YELLOW}⚠️  Stale ADRs in doing/:${NC}\n`);

  for (const adr of result.staleAdrs) {
    const relativePath = relative(projectRoot, adr.file);
    console.log(`  ${relativePath}`);
    console.log(`    - ${adr.reason}`);
    console.log(`    - Days since modified: ${adr.daysSinceModified}`);
    console.log(`    - Has source references: ${adr.hasSourceReferences}`);
    console.log();
  }

  console.log("Recommendations:");
  console.log("  - If work is ongoing, add source files that reference the ADR");
  console.log("  - If work is blocked, move ADR back to todo/");
  console.log("  - If work is complete, move ADR to done/");
  console.log();
}

// Summary
console.log("=".repeat(50));
if (result.success) {
  console.log(
    `${GREEN}✅ ADR staleness check passed (${result.activeFiles}/${result.checkedFiles} active)${NC}`,
  );
  process.exit(0);
} else {
  console.log(
    `${YELLOW}⚠️  ADR staleness check found ${result.staleAdrs.length} stale ADR(s)${NC}`,
  );

  // In CI, stale ADRs are blocking to prevent abandoned work
  if (isCI) {
    console.log(`\n${RED}❌ Failing in CI - stale ADRs must be addressed:${NC}`);
    console.log("   - Move completed ADRs to done/");
    console.log("   - Move blocked ADRs back to todo/");
    console.log("   - Add source references for in-progress ADRs");
    process.exit(1);
  }

  // Locally, just warn
  process.exit(0);
}
