#!/usr/bin/env node
/**
 * Validate test-design traceability
 *
 * Checks:
 * 1. Design docs (features, scenarios) have test coverage
 * 2. Test files reference their design docs via @design-doc comments
 * 3. Bidirectional links are valid (files exist)
 *
 * ADR: ADR-001-task-file-format
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative, dirname, basename } from "node:path";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
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
      if (!entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== "dist") {
        findFiles(fullPath, pattern, files);
      }
    } else if (pattern.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Extract @design-doc references from a test file
 */
function extractDesignDocRefs(content) {
  const refs = [];
  // Match @design-doc comments: @design-doc docs/design/core/features/xxx.md
  const pattern = /@design-doc\s+([^\s*]+)/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    refs.push(match[1]);
  }
  return refs;
}

/**
 * Extract test file references from a design doc
 * Looks for "## Tests" section or "## Test Coverage" section
 */
function extractTestRefs(content) {
  const refs = [];
  // Match test file paths in markdown links or code blocks
  // e.g., - `packages/core/src/__tests__/xxx.test.ts`
  // or [test](packages/core/src/__tests__/xxx.test.ts)
  const patterns = [
    /`(packages\/[^`]+\.test\.ts)`/g,
    /\]\((packages\/[^)]+\.test\.ts)\)/g,
    /- (packages\/[^\s]+\.test\.ts)/g,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      refs.push(match[1]);
    }
  }
  return refs;
}

/**
 * Get all design docs (features and scenarios)
 */
function getDesignDocs() {
  const designDirs = [
    "docs/design/core/features",
    "docs/design/core/scenarios",
    "docs/design/core/enhancements",
    "docs/design/core/use-cases",
  ];

  const docs = [];
  for (const dirPath of designDirs) {
    const fullDir = join(projectRoot, dirPath);
    if (!existsSync(fullDir)) continue;

    const files = findFiles(fullDir, /\.md$/);
    for (const file of files) {
      const relPath = relative(projectRoot, file);
      const content = readFileSync(file, "utf-8");
      const testRefs = extractTestRefs(content);
      const category = basename(dirname(relPath));
      
      docs.push({
        path: relPath,
        category,
        content,
        testRefs,
      });
    }
  }
  return docs;
}

/**
 * Get all test files
 */
function getTestFiles() {
  const srcDir = join(projectRoot, "packages");
  if (!existsSync(srcDir)) return [];

  const testFiles = findFiles(srcDir, /\.test\.ts$/);
  const tests = [];

  for (const file of testFiles) {
    const relPath = relative(projectRoot, file);
    const content = readFileSync(file, "utf-8");
    const designDocRefs = extractDesignDocRefs(content);

    tests.push({
      path: relPath,
      content,
      designDocRefs,
    });
  }
  return tests;
}

/**
 * Validate design docs have test coverage
 */
function validateDesignDocCoverage(designDocs, testFiles) {
  console.log("\n📋 Checking design doc test coverage...\n");

  // Build a map of design doc paths to test files that reference them
  const docToTests = new Map();
  for (const doc of designDocs) {
    docToTests.set(doc.path, []);
  }

  for (const test of testFiles) {
    for (const ref of test.designDocRefs) {
      if (docToTests.has(ref)) {
        docToTests.get(ref).push(test.path);
      }
    }
  }

  let covered = 0;
  let uncovered = 0;

  for (const doc of designDocs) {
    const tests = docToTests.get(doc.path) || [];
    
    if (tests.length > 0) {
      console.log(`${GREEN}  [OK] ${doc.path}${NC}`);
      console.log(`       └─ ${tests.length} test file(s)`);
      covered++;
    } else {
      console.log(`${YELLOW}  [WARN] ${doc.path}: No test coverage${NC}`);
      warnings++;
      uncovered++;
    }
  }

  console.log(`\n  ${covered}/${designDocs.length} design docs have test coverage`);
}

/**
 * Validate test files reference design docs
 */
function validateTestDesignDocRefs(testFiles) {
  console.log("\n📂 Checking test file design doc references...\n");

  let withRefs = 0;
  let withoutRefs = 0;
  let brokenLinks = 0;

  for (const test of testFiles) {
    if (test.designDocRefs.length === 0) {
      console.log(`${YELLOW}  [WARN] ${test.path}: No @design-doc reference${NC}`);
      warnings++;
      withoutRefs++;
    } else {
      // Check if referenced design docs exist
      let allValid = true;
      for (const ref of test.designDocRefs) {
        const fullPath = join(projectRoot, ref);
        if (!existsSync(fullPath)) {
          console.log(`${RED}  [ERR] ${test.path}: Broken link to ${ref}${NC}`);
          errors++;
          brokenLinks++;
          allValid = false;
        }
      }
      
      if (allValid) {
        console.log(`${GREEN}  [OK] ${test.path}${NC}`);
        console.log(`       └─ ${test.designDocRefs.join(", ")}`);
        withRefs++;
      }
    }
  }

  console.log(`\n  ${withRefs}/${testFiles.length} test files have valid @design-doc references`);
  if (brokenLinks > 0) {
    console.log(`${RED}  ${brokenLinks} broken link(s)${NC}`);
  }
}

/**
 * Validate design doc test refs point to existing files
 */
function validateDesignDocTestRefs(designDocs) {
  console.log("\n🔗 Checking design doc test references...\n");

  let brokenLinks = 0;
  let validLinks = 0;

  for (const doc of designDocs) {
    if (doc.testRefs.length === 0) continue;

    for (const ref of doc.testRefs) {
      const fullPath = join(projectRoot, ref);
      if (!existsSync(fullPath)) {
        console.log(`${RED}  [ERR] ${doc.path}: Broken link to ${ref}${NC}`);
        errors++;
        brokenLinks++;
      } else {
        validLinks++;
      }
    }
  }

  if (brokenLinks === 0 && validLinks > 0) {
    console.log(`${GREEN}  All ${validLinks} test references are valid${NC}`);
  } else if (validLinks === 0) {
    console.log(`${CYAN}  No explicit test references in design docs${NC}`);
  }
}

// Run validations
console.log("🧪 Validating test-design traceability...");

const designDocs = getDesignDocs();
const testFiles = getTestFiles();

console.log(`\n  Found ${designDocs.length} design doc(s)`);
console.log(`  Found ${testFiles.length} test file(s)`);

if (designDocs.length === 0 && testFiles.length === 0) {
  console.log(`\n${YELLOW}⚠️  No design docs or test files found${NC}`);
  process.exit(0);
}

validateDesignDocCoverage(designDocs, testFiles);
validateTestDesignDocRefs(testFiles);
validateDesignDocTestRefs(designDocs);

// Summary
console.log("\n" + "=".repeat(50));
if (errors > 0) {
  console.log(`${RED}❌ ${errors} error(s), ${warnings} warning(s)${NC}`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`${YELLOW}⚠️  ${warnings} warning(s)${NC}`);
  process.exit(0);
} else {
  console.log(`${GREEN}✅ All test-design traceability validated${NC}`);
  process.exit(0);
}
