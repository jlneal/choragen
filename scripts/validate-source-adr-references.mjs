#!/usr/bin/env node
/**
 * Validate source file ADR references
 *
 * Checks:
 * 1. Source files in packages/ have ADR reference comments
 * 2. Reports files missing ADR references
 * 3. Supports configurable file patterns
 *
 * ADR: ADR-001-task-file-format
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const NC = "\x1b[0m";

const projectRoot = process.cwd();

// Configuration: patterns to include/exclude
const CONFIG = {
  // Directories to scan
  scanDirs: ["packages"],

  // File extensions to check
  extensions: [".ts", ".tsx", ".mts"],

  // Patterns to exclude (relative paths)
  excludePatterns: [
    /\/__tests__\//,
    /\.test\./,
    /\.spec\./,
    /\/dist\//,
    /\/node_modules\//,
    /index\.ts$/,
    /types\.ts$/,
    /\.d\.ts$/,
  ],

  // Number of lines to scan for ADR reference
  scanLineLimit: 50,
};

// ADR reference patterns
const ADR_PATTERNS = [
  /(?:\/\/|\/\*|\*)\s*(?:ADR:|@adr)\s*(ADR-\d{3}-[\w-]+)/,
  /ADR References?:/i,
  /docs\/adr\/\d{4}-/,
  /docs\/adr\/ADR-\d{3}-/,
];

let warnings = 0;

/**
 * Recursively find all files matching criteria
 */
function findSourceFiles(dir, files = []) {
  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relPath = relative(projectRoot, fullPath);

    if (entry.isDirectory()) {
      // Skip excluded directories
      if (
        !entry.name.startsWith(".") &&
        entry.name !== "node_modules" &&
        entry.name !== "dist"
      ) {
        findSourceFiles(fullPath, files);
      }
    } else {
      // Check if file matches criteria
      const hasValidExtension = CONFIG.extensions.some((ext) =>
        entry.name.endsWith(ext)
      );
      const isExcluded = CONFIG.excludePatterns.some((pattern) =>
        pattern.test(relPath)
      );

      if (hasValidExtension && !isExcluded) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

/**
 * Check if file has ADR reference in first N lines
 */
function hasAdrReference(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").slice(0, CONFIG.scanLineLimit);
  const headerContent = lines.join("\n");

  return ADR_PATTERNS.some((pattern) => pattern.test(headerContent));
}

/**
 * Extract ADR reference from file if present
 */
function extractAdrReference(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").slice(0, CONFIG.scanLineLimit);
  const headerContent = lines.join("\n");

  // Try to extract specific ADR ID
  const match = headerContent.match(
    /(?:ADR:|@adr)\s*(ADR-\d{3}-[\w-]+)/
  );
  if (match) {
    return match[1];
  }

  // Try to extract from docs path
  const docsMatch = headerContent.match(/docs\/adr\/(ADR-\d{3}-[\w-]+)/);
  if (docsMatch) {
    return docsMatch[1];
  }

  return null;
}

/**
 * Validate source files have ADR references
 */
function validateSourceAdrReferences() {
  console.log("\n📂 Checking source file ADR references...\n");

  const allFiles = [];

  for (const scanDir of CONFIG.scanDirs) {
    const fullDir = join(projectRoot, scanDir);
    if (existsSync(fullDir)) {
      const files = findSourceFiles(fullDir);
      allFiles.push(...files);
    }
  }

  if (allFiles.length === 0) {
    console.log(`${YELLOW}  No source files found to check${NC}`);
    return { total: 0, withRefs: 0, missing: 0, files: [] };
  }

  const filesWithRefs = [];
  const filesMissingRefs = [];

  for (const filePath of allFiles) {
    const relPath = relative(projectRoot, filePath);

    if (hasAdrReference(filePath)) {
      const adrRef = extractAdrReference(filePath);
      filesWithRefs.push({ path: relPath, adr: adrRef });
    } else {
      filesMissingRefs.push(relPath);
      warnings++;
    }
  }

  // Report files with references
  if (filesWithRefs.length > 0) {
    console.log(`${GREEN}  Files with ADR references:${NC}`);
    for (const file of filesWithRefs) {
      const adrInfo = file.adr ? ` (${file.adr})` : "";
      console.log(`    ✓ ${file.path}${adrInfo}`);
    }
  }

  // Report files missing references
  if (filesMissingRefs.length > 0) {
    console.log(`\n${YELLOW}  Files missing ADR references:${NC}`);
    for (const file of filesMissingRefs) {
      console.log(`    ○ ${file}`);
    }
  }

  return {
    total: allFiles.length,
    withRefs: filesWithRefs.length,
    missing: filesMissingRefs.length,
    files: filesMissingRefs,
  };
}

/**
 * Print usage instructions for adding ADR references
 */
function printUsageInstructions() {
  console.log(`\n${YELLOW}To add ADR references, use one of these formats:${NC}`);
  console.log(`
  // Single-line comment:
  // ADR: ADR-001-task-file-format

  // JSDoc block:
  /**
   * ADR References:
   * - docs/adr/ADR-001-task-file-format.md
   */
`);
}

// Run validation
console.log("🔗 Validating source file ADR references...");

const stats = validateSourceAdrReferences();

// Summary
console.log("\n" + "=".repeat(50));

if (stats.total > 0) {
  const coveragePercent =
    stats.total > 0 ? Math.round((stats.withRefs / stats.total) * 100) : 100;

  console.log(`\nADR Reference Coverage: ${coveragePercent}%`);
  console.log(`  Total files checked: ${stats.total}`);
  console.log(`  With ADR references: ${stats.withRefs}`);
  console.log(`  Missing references: ${stats.missing}`);
}

console.log("");

if (warnings > 0) {
  printUsageInstructions();
  console.log(`${YELLOW}⚠️  ${warnings} file(s) missing ADR references${NC}`);
  process.exit(0); // Warnings only, not errors
} else {
  console.log(`${GREEN}✅ All source files have ADR references${NC}`);
  process.exit(0);
}
