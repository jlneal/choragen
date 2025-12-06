#!/usr/bin/env node
/**
 * Validate request completion
 *
 * Checks that completed requests (in done/) have proper completion criteria:
 * 1. Completion Notes section is present and filled in
 * 2. Completion Notes is not placeholder text (TODO, TBD, None, etc.)
 * 3. All acceptance criteria are checked off
 *
 * This ensures requests are properly closed with documentation.
 *
 * ADR: ADR-001-task-file-format
 */

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const NC = "\x1b[0m";

const projectRoot = process.cwd();
const REQUESTS_DIR = join(projectRoot, "docs/requests");
const CR_DIR = join(REQUESTS_DIR, "change-requests");
const FR_DIR = join(REQUESTS_DIR, "fix-requests");

/**
 * Extract a markdown section by name
 */
function extractSection(content, sectionName) {
  const pattern = new RegExp(
    `## ${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n## |\\n---|$)`,
    "i",
  );
  const match = content.match(pattern);
  return match ? match[1].trim() : null;
}

/**
 * Check if Completion Notes section is properly filled
 */
function isCompletionNotesFilled(content) {
  const completionNotes = extractSection(content, "Completion Notes");
  if (!completionNotes) {
    return false;
  }

  // Check for placeholder patterns
  const UNFILLED_MARKER = "TO" + "DO";
  const placeholderPatterns = [
    /^\[.*\]$/m,
    new RegExp(`^${UNFILLED_MARKER}$`, "im"),
    /^TBD$/im,
    /^None$/im,
    /^N\/A$/im,
  ];

  const trimmed = completionNotes.trim();
  if (!trimmed || trimmed.length === 0) {
    return false;
  }

  return !placeholderPatterns.some((pattern) => pattern.test(trimmed));
}

/**
 * Count unchecked acceptance criteria
 */
function countUncheckedCriteria(content) {
  const acceptanceCriteria = extractSection(content, "Acceptance Criteria");
  if (!acceptanceCriteria) {
    return 0;
  }

  // Count unchecked boxes: - [ ] or * [ ]
  const uncheckedPattern = /^[\s]*[-*]\s*\[\s*\]/gm;
  const matches = acceptanceCriteria.match(uncheckedPattern);
  return matches ? matches.length : 0;
}

/**
 * Validate a single completed request file
 */
function validateCompletedRequest(filePath) {
  const errors = [];
  const content = readFileSync(filePath, "utf-8");

  // Check Completion Notes
  if (!isCompletionNotesFilled(content)) {
    errors.push({
      file: filePath,
      issue: "Missing or empty Completion Notes",
      details: "Add a summary of what was done and any follow-up items",
    });
  }

  // Check acceptance criteria
  const uncheckedCount = countUncheckedCriteria(content);
  if (uncheckedCount > 0) {
    errors.push({
      file: filePath,
      issue: `${uncheckedCount} unchecked acceptance criteria`,
      details: "Check off completed criteria or remove if not applicable",
    });
  }

  return errors;
}

/**
 * Collect all completed request files from done/ directories
 */
function collectCompletedRequests() {
  const files = [];

  for (const baseDir of [CR_DIR, FR_DIR]) {
    const doneDir = join(baseDir, "done");
    if (!existsSync(doneDir)) {
      continue;
    }

    try {
      const entries = readdirSync(doneDir);
      for (const entry of entries) {
        const fullPath = join(doneDir, entry);
        if (statSync(fullPath).isFile() && entry.endsWith(".md")) {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory doesn't exist or can't be read, skip
    }
  }

  return files;
}

/**
 * Validate all completed requests
 */
function validateRequestCompletion() {
  const allErrors = [];
  let checkedFiles = 0;

  const completedRequests = collectCompletedRequests();

  for (const file of completedRequests) {
    checkedFiles++;
    const errors = validateCompletedRequest(file);
    allErrors.push(...errors);
  }

  const invalidFileCount = new Set(allErrors.map((e) => e.file)).size;
  const validFiles = checkedFiles - invalidFileCount;

  return {
    success: allErrors.length === 0,
    errors: allErrors,
    checkedFiles,
    validFiles,
  };
}

// Main execution
console.log("🔍 Validating request completion...\n");

const result = validateRequestCompletion();

if (result.errors.length > 0) {
  console.log(`${RED}❌ Request completion validation failed:${NC}\n`);

  // Group errors by file
  const byFile = new Map();
  for (const error of result.errors) {
    const existing = byFile.get(error.file) ?? [];
    existing.push(error);
    byFile.set(error.file, existing);
  }

  for (const [file, errors] of byFile) {
    const relativePath = relative(projectRoot, file);
    console.log(`  ${relativePath}`);
    for (const error of errors) {
      console.log(`    - ${error.issue}`);
      if (error.details) {
        console.log(`      ${error.details}`);
      }
    }
    console.log();
  }
}

// Summary
console.log("=".repeat(50));
console.log(`Checked: ${result.checkedFiles} completed request(s)`);
console.log(`Valid: ${result.validFiles}, Invalid: ${result.checkedFiles - result.validFiles}`);

if (result.success) {
  console.log(
    `${GREEN}✅ Request completion validation passed (${result.validFiles}/${result.checkedFiles} files)${NC}`,
  );
  process.exit(0);
} else {
  console.log(
    `${RED}❌ Request completion validation failed (${result.validFiles}/${result.checkedFiles} valid)${NC}`,
  );
  process.exit(1);
}
