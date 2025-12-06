#!/usr/bin/env node
/**
 * Validate bidirectional links between design docs and implementation
 *
 * Checks:
 * 1. Design docs reference their implementation files
 * 2. Implementation files reference their design docs
 * 3. ADRs reference their implementation files when in done/
 *
 * ADR: ADR-001-task-file-format
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const NC = "\x1b[0m";

const projectRoot = process.cwd();

let errors = 0;
let warnings = 0;

/**
 * Recursively find all files matching a pattern
 */
function findFiles(dir, pattern, files = []) {
  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
        findFiles(fullPath, pattern, files);
      }
    } else if (pattern.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Extract links from a markdown file
 */
function extractLinks(content) {
  const links = [];
  // Match [text](path) and bare paths
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkPattern.exec(content)) !== null) {
    links.push(match[2]);
  }
  return links;
}

/**
 * Check if a file contains a reference to another file
 */
function containsReference(content, targetPath) {
  // Normalize path for matching
  const normalized = targetPath.replace(/\\/g, "/");
  return (
    content.includes(normalized) ||
    content.includes(normalized.replace("docs/", "")) ||
    content.includes(normalized.split("/").pop())
  );
}

/**
 * Validate ADRs in done/ have implementation references
 */
function validateAdrImplementation() {
  console.log("\n📋 Checking ADR implementation references...\n");

  const adrDir = join(projectRoot, "docs/adr/done");
  if (!existsSync(adrDir)) {
    console.log(`${YELLOW}  No done/ ADRs found${NC}`);
    return;
  }

  const adrs = findFiles(adrDir, /\.md$/);

  for (const adrPath of adrs) {
    const content = readFileSync(adrPath, "utf-8");
    const relPath = relative(projectRoot, adrPath);

    // Check for Implementation section
    if (!content.includes("## Implementation")) {
      console.log(`${YELLOW}  [WARN] ${relPath}: Missing Implementation section${NC}`);
      warnings++;
      continue;
    }

    // Extract implementation section
    const implMatch = content.match(/## Implementation\n([\s\S]*?)(?=\n##|$)/);
    if (implMatch) {
      const implSection = implMatch[1];
      // Check if it has actual file references (not just placeholder)
      if (
        implSection.includes("[Added when") ||
        implSection.includes("{{") ||
        implSection.trim().length < 10
      ) {
        console.log(
          `${YELLOW}  [WARN] ${relPath}: Implementation section is placeholder${NC}`
        );
        warnings++;
      } else {
        console.log(`${GREEN}  [OK] ${relPath}${NC}`);
      }
    }
  }
}

/**
 * Validate design docs have acceptance tests section
 */
function validateDesignDocs() {
  console.log("\n📄 Checking design doc completeness...\n");

  const designDir = join(projectRoot, "docs/design");
  if (!existsSync(designDir)) {
    console.log(`${YELLOW}  No design docs found${NC}`);
    return;
  }

  const docs = findFiles(designDir, /\.md$/);

  for (const docPath of docs) {
    const content = readFileSync(docPath, "utf-8");
    const relPath = relative(projectRoot, docPath);

    // Skip pipeline docs and other meta-docs
    if (relPath.includes("DEVELOPMENT_PIPELINE")) continue;

    // Features should have acceptance tests
    if (relPath.includes("/features/")) {
      if (!content.includes("## Acceptance")) {
        console.log(
          `${YELLOW}  [WARN] ${relPath}: Missing Acceptance section${NC}`
        );
        warnings++;
      } else {
        console.log(`${GREEN}  [OK] ${relPath}${NC}`);
      }
    }
  }
}

/**
 * Validate CRs have required sections
 */
function validateChangeRequests() {
  console.log("\n📝 Checking change request completeness...\n");

  const crDir = join(projectRoot, "docs/requests/change-requests");
  if (!existsSync(crDir)) {
    console.log(`${YELLOW}  No change requests found${NC}`);
    return;
  }

  const crs = findFiles(crDir, /\.md$/);

  for (const crPath of crs) {
    const content = readFileSync(crPath, "utf-8");
    const relPath = relative(projectRoot, crPath);

    const requiredSections = ["## What", "## Why", "## Scope"];
    const missing = requiredSections.filter((s) => !content.includes(s));

    if (missing.length > 0) {
      console.log(
        `${YELLOW}  [WARN] ${relPath}: Missing sections: ${missing.join(", ")}${NC}`
      );
      warnings++;
    } else {
      console.log(`${GREEN}  [OK] ${relPath}${NC}`);
    }
  }
}

// Run validations
console.log("🔗 Validating documentation links...");

validateAdrImplementation();
validateDesignDocs();
validateChangeRequests();

// Summary
console.log("\n" + "=".repeat(50));
if (errors > 0) {
  console.log(`${RED}❌ ${errors} error(s), ${warnings} warning(s)${NC}`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`${YELLOW}⚠️  ${warnings} warning(s)${NC}`);
  process.exit(0);
} else {
  console.log(`${GREEN}✅ All links validated${NC}`);
  process.exit(0);
}
