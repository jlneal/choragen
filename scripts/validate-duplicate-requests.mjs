#!/usr/bin/env node
/**
 * Validate that no request ID appears in multiple directories.
 *
 * Checks:
 * 1. Same request ID in multiple status directories (todo/doing/done)
 * 2. Same filename in different directories
 *
 * ADR: ADR-001-task-file-format
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const NC = "\x1b[0m";

const REQUEST_DIRS = [
  "docs/requests/change-requests",
  "docs/requests/fix-requests",
];

const STATUS_DIRS = ["todo", "doing", "done"];

/**
 * Extract request ID from filename or file content
 */
function extractRequestId(filePath) {
  const filename = basename(filePath);

  // Try to extract from filename: CR-YYYYMMDD-NNN or FR-YYYYMMDD-NNN
  const filenameMatch = filename.match(/((?:CR|FR)-\d{8}-\d{3})/);
  if (filenameMatch) {
    return filenameMatch[1];
  }

  // Fall back to reading file content
  try {
    const content = readFileSync(filePath, "utf-8");
    const contentMatch = content.match(/\*\*ID\*\*:\s*((?:CR|FR)-\d{8}-\d{3})/);
    if (contentMatch) {
      return contentMatch[1];
    }
  } catch {
    // File might not be readable
  }

  return null;
}

/**
 * Scan all request directories and build ID -> paths map
 */
function scanRequests() {
  const idToFiles = new Map();

  for (const requestDir of REQUEST_DIRS) {
    for (const statusDir of STATUS_DIRS) {
      const dirPath = join(requestDir, statusDir);

      if (!existsSync(dirPath)) {
        continue;
      }

      try {
        const files = readdirSync(dirPath);
        for (const file of files) {
          if (!file.endsWith(".md")) continue;

          const filePath = join(dirPath, file);
          const requestId = extractRequestId(filePath);

          if (requestId) {
            if (!idToFiles.has(requestId)) {
              idToFiles.set(requestId, []);
            }
            idToFiles.get(requestId).push(filePath);
          }
        }
      } catch {
        // Directory might not exist
      }
    }
  }

  return idToFiles;
}

/**
 * Find duplicates (IDs with multiple files)
 */
function findDuplicates(idToFiles) {
  const duplicates = [];

  for (const [id, files] of idToFiles) {
    if (files.length > 1) {
      duplicates.push({ id, files });
    }
  }

  return duplicates;
}

// Main
console.log("🔍 Checking for duplicate requests...\n");

const idToFiles = scanRequests();
const duplicates = findDuplicates(idToFiles);

if (duplicates.length === 0) {
  console.log("==================================================");
  console.log(`${GREEN}✅ No duplicate requests found${NC}`);
  console.log(`   Checked ${idToFiles.size} unique request IDs`);
  process.exit(0);
} else {
  console.log(`${RED}❌ Duplicate requests detected:${NC}\n`);

  for (const { id, files } of duplicates) {
    console.log(`  ${YELLOW}${id}${NC}`);
    console.log("  Found in:");
    for (const file of files) {
      console.log(`    - ${file}`);
    }
    console.log("  Resolution: Remove the incorrect copy\n");
  }

  console.log("==================================================");
  console.log(
    `${RED}❌ Found ${duplicates.length} duplicate request(s)${NC}`
  );
  process.exit(1);
}
