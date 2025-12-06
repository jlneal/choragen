#!/usr/bin/env node
/**
 * Validate ADR traceability
 *
 * Checks:
 * 1. ADRs in done/ have linked CR/FR
 * 2. ADRs reference design docs
 * 3. Source files reference their governing ADR
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
 * Check ADRs have required links
 */
function validateAdrLinks() {
  console.log("\n📋 Checking ADR links...\n");

  const adrDirs = ["docs/adr/doing", "docs/adr/done"];

  for (const dirPath of adrDirs) {
    const fullDir = join(projectRoot, dirPath);
    if (!existsSync(fullDir)) continue;

    const adrs = findFiles(fullDir, /\.md$/);

    for (const adrPath of adrs) {
      const content = readFileSync(adrPath, "utf-8");
      const relPath = relative(projectRoot, adrPath);

      // Check for CR/FR link
      const hasCrFr = /\*\*Linked CR\/FR\*\*:.*(?:CR|FR)-\d{8}-\d{3}/.test(content) ||
                      content.includes("CR-") || content.includes("FR-");

      if (!hasCrFr) {
        console.log(`${YELLOW}  [WARN] ${relPath}: No CR/FR reference${NC}`);
        warnings++;
      }

      // Check for design doc link (for done/ ADRs)
      if (dirPath.includes("done")) {
        const hasDesignDoc = content.includes("docs/design/") ||
                            content.includes("Linked Design");

        if (!hasDesignDoc) {
          console.log(`${YELLOW}  [WARN] ${relPath}: No design doc reference${NC}`);
          warnings++;
        } else {
          console.log(`${GREEN}  [OK] ${relPath}${NC}`);
        }
      } else {
        console.log(`${GREEN}  [OK] ${relPath}${NC}`);
      }
    }
  }
}

/**
 * Check source files have ADR references
 */
function validateSourceAdrReferences() {
  console.log("\n📂 Checking source file ADR references...\n");

  const srcDir = join(projectRoot, "packages");
  if (!existsSync(srcDir)) {
    console.log(`${YELLOW}  No packages directory found${NC}`);
    return;
  }

  const sourceFiles = findFiles(srcDir, /\.ts$/);
  const ADR_PATTERN = /(?:\/\/|\/\*|\*)\s*(?:ADR:|@adr)\s*(ADR-\d{3}-[\w-]+)/;

  // Files that should have ADR references (main implementation files, not tests/index)
  const shouldHaveAdr = sourceFiles.filter((f) => {
    const rel = relative(projectRoot, f);
    return (
      !rel.includes("__tests__") &&
      !rel.includes(".test.") &&
      !rel.endsWith("index.ts") &&
      !rel.includes("/dist/")
    );
  });

  let checked = 0;
  let missing = 0;

  for (const filePath of shouldHaveAdr) {
    const content = readFileSync(filePath, "utf-8");
    const relPath = relative(projectRoot, filePath);

    if (!ADR_PATTERN.test(content)) {
      console.log(`${YELLOW}  [WARN] ${relPath}: No ADR reference${NC}`);
      missing++;
      warnings++;
    }
    checked++;
  }

  if (missing === 0 && checked > 0) {
    console.log(`${GREEN}  All ${checked} source files have ADR references${NC}`);
  } else {
    console.log(`\n  ${checked - missing}/${checked} files have ADR references`);
  }
}

// Run validations
console.log("🔗 Validating ADR traceability...");

validateAdrLinks();
validateSourceAdrReferences();

// Summary
console.log("\n" + "=".repeat(50));
if (errors > 0) {
  console.log(`${RED}❌ ${errors} error(s), ${warnings} warning(s)${NC}`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`${YELLOW}⚠️  ${warnings} warning(s)${NC}`);
  process.exit(0);
} else {
  console.log(`${GREEN}✅ All ADR traceability validated${NC}`);
  process.exit(0);
}
