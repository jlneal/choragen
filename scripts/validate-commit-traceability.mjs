#!/usr/bin/env node
/**
 * Validate commit traceability
 *
 * Checks that recent commits reference CR/FR in docs/requests/
 *
 * Usage:
 *   node scripts/validate-commit-traceability.mjs [--since=HEAD~10]
 *
 * ADR: ADR-001-task-file-format
 */

import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const NC = "\x1b[0m";

const projectRoot = process.cwd();

// Parse arguments
const args = process.argv.slice(2);
const sinceArg = args.find((a) => a.startsWith("--since="));
const since = sinceArg ? sinceArg.split("=")[1] : "HEAD~10";

// Exempt commit types that don't require CR/FR
const EXEMPT_PATTERNS = [
  /^chore\(deps\):/,
  /^chore\(format\):/,
  /^chore\(planning\):/,
  /^ci:/,
  /^build:/,
  /^Merge /,
  /^Initial commit$/,
];

let errors = 0;
let warnings = 0;

/**
 * Get list of CR/FR IDs from docs/requests
 */
function getValidRequestIds() {
  const ids = new Set();

  const crDir = join(projectRoot, "docs/requests/change-requests");
  const frDir = join(projectRoot, "docs/requests/fix-requests");

  for (const dir of [crDir, frDir]) {
    if (!existsSync(dir)) continue;

    const subdirs = ["todo", "doing", "done"];
    for (const subdir of subdirs) {
      const fullPath = join(dir, subdir);
      if (!existsSync(fullPath)) continue;

      const files = readdirSync(fullPath);
      for (const file of files) {
        // Extract ID from filename like CR-20251201-001-feature-name.md
        const match = file.match(/((?:CR|FR)-\d{8}-\d{3})/);
        if (match) {
          ids.add(match[1]);
        }
      }
    }
  }

  return ids;
}

/**
 * Get recent commits
 */
function getRecentCommits() {
  try {
    const output = execSync(`git log ${since}..HEAD --format="%H|%s"`, {
      encoding: "utf-8",
      cwd: projectRoot,
    });

    return output
      .trim()
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => {
        const [hash, ...subjectParts] = line.split("|");
        return { hash, subject: subjectParts.join("|") };
      });
  } catch {
    // No commits in range or git error
    return [];
  }
}

/**
 * Check if a commit message is exempt from CR/FR requirement
 */
function isExempt(subject) {
  return EXEMPT_PATTERNS.some((pattern) => pattern.test(subject));
}

/**
 * Extract CR/FR references from commit message
 */
function extractReferences(subject) {
  const refs = [];
  const pattern = /(CR|FR)-\d{8}-\d{3}/g;
  let match;
  while ((match = pattern.exec(subject)) !== null) {
    refs.push(match[0]);
  }
  return refs;
}

// Run validation
console.log("📝 Validating commit traceability...\n");
console.log(`  Checking commits since: ${since}\n`);

const validIds = getValidRequestIds();
const commits = getRecentCommits();

if (commits.length === 0) {
  console.log(`${YELLOW}  No commits found in range${NC}`);
  process.exit(0);
}

console.log(`  Found ${commits.length} commit(s) to check\n`);

for (const { hash, subject } of commits) {
  const shortHash = hash.substring(0, 7);

  if (isExempt(subject)) {
    console.log(`${DIM}  [SKIP] ${shortHash}: ${subject}${NC}`);
    continue;
  }

  const refs = extractReferences(subject);

  if (refs.length === 0) {
    console.log(`${RED}  [ERR]  ${shortHash}: No CR/FR reference${NC}`);
    console.log(`${DIM}         "${subject}"${NC}`);
    errors++;
    continue;
  }

  // Validate that referenced CR/FR exists
  const invalidRefs = refs.filter((ref) => !validIds.has(ref));

  if (invalidRefs.length > 0) {
    console.log(
      `${YELLOW}  [WARN] ${shortHash}: Unknown reference(s): ${invalidRefs.join(", ")}${NC}`
    );
    console.log(`${DIM}         "${subject}"${NC}`);
    warnings++;
  } else {
    console.log(`${GREEN}  [OK]   ${shortHash}: ${refs.join(", ")}${NC}`);
  }
}

// Summary
console.log("\n" + "=".repeat(50));
if (errors > 0) {
  console.log(`${RED}❌ ${errors} error(s), ${warnings} warning(s)${NC}`);
  console.log(`\n${DIM}Commits must reference a CR/FR in the message.`);
  console.log(`Exempt types: chore(deps), chore(format), chore(planning), ci, build${NC}`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`${YELLOW}⚠️  ${warnings} warning(s)${NC}`);
  process.exit(0);
} else {
  console.log(`${GREEN}✅ All commits have valid traceability${NC}`);
  process.exit(0);
}
