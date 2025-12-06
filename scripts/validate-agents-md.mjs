#!/usr/bin/env node
/**
 * Validate AGENTS.md presence in key directories
 *
 * Checks that AGENTS.md exists in:
 * - packages/*
 * - scripts/
 * - docs/
 * - templates/
 * - githooks/
 *
 * ADR: ADR-001-task-file-format
 */

import { existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const NC = "\x1b[0m";

const projectRoot = process.cwd();

let errors = 0;

/**
 * Directories that must have AGENTS.md
 */
const REQUIRED_DIRS = ["scripts", "docs", "templates", "githooks"];

/**
 * Check if a directory has AGENTS.md
 */
function checkAgentsMd(dir, label) {
  const agentsPath = join(dir, "AGENTS.md");
  const relPath = relative(projectRoot, dir);

  if (!existsSync(dir)) {
    console.log(`${YELLOW}  [SKIP] ${label || relPath}: Directory does not exist${NC}`);
    return true; // Not an error if dir doesn't exist
  }

  if (existsSync(agentsPath)) {
    console.log(`${GREEN}  [OK]   ${label || relPath}/AGENTS.md${NC}`);
    return true;
  } else {
    console.log(`${RED}  [ERR]  ${label || relPath}/AGENTS.md: Missing${NC}`);
    errors++;
    return false;
  }
}

/**
 * Check all packages have AGENTS.md
 */
function checkPackages() {
  const packagesDir = join(projectRoot, "packages");

  if (!existsSync(packagesDir)) {
    console.log(`${YELLOW}  [SKIP] packages/: Directory does not exist${NC}`);
    return;
  }

  const entries = readdirSync(packagesDir, { withFileTypes: true });
  const packages = entries.filter(
    (e) => e.isDirectory() && !e.name.startsWith(".")
  );

  if (packages.length === 0) {
    console.log(`${YELLOW}  [SKIP] packages/: No packages found${NC}`);
    return;
  }

  for (const pkg of packages) {
    const pkgDir = join(packagesDir, pkg.name);
    checkAgentsMd(pkgDir, `packages/${pkg.name}`);
  }
}

// Run validation
console.log("📋 Validating AGENTS.md presence...\n");

// Check required directories
console.log("  Required directories:\n");
for (const dir of REQUIRED_DIRS) {
  checkAgentsMd(join(projectRoot, dir), dir);
}

// Check packages
console.log("\n  Packages:\n");
checkPackages();

// Summary
console.log("\n" + "=".repeat(50));
if (errors > 0) {
  console.log(`${RED}❌ ${errors} missing AGENTS.md file(s)${NC}`);
  console.log(`\n${YELLOW}Create missing files using the template:${NC}`);
  console.log(`  cp templates/AGENTS.md <target-directory>/AGENTS.md`);
  process.exit(1);
} else {
  console.log(`${GREEN}✅ All required AGENTS.md files present${NC}`);
  process.exit(0);
}
