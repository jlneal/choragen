#!/usr/bin/env node
/**
 * Validate complete traceability chain
 *
 * Checks the full Request → Design → ADR → Code chain:
 * 1. CRs/FRs reference design docs
 * 2. Design docs reference ADRs
 * 3. ADRs reference source files
 *
 * ADR: ADR-001-task-file-format
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const NC = "\x1b[0m";

const projectRoot = process.cwd();

const REPORT_SEPARATOR_LENGTH = 60;

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
 * Check CRs/FRs reference design docs
 */
function validateRequestToDesign() {
  const result = { success: true, checked: 0, missing: [], details: [] };

  const requestDirs = [
    "docs/requests/change-requests/doing",
    "docs/requests/change-requests/done",
    "docs/requests/fix-requests/doing",
    "docs/requests/fix-requests/done",
  ];

  for (const dirPath of requestDirs) {
    const fullDir = join(projectRoot, dirPath);
    if (!existsSync(fullDir)) continue;

    const requests = findFiles(fullDir, /\.md$/);

    for (const reqPath of requests) {
      const content = readFileSync(reqPath, "utf-8");
      const relPath = relative(projectRoot, reqPath);

      result.checked++;

      // Check for design doc reference
      const hasDesignRef =
        content.includes("docs/design/") ||
        content.includes("## Design") ||
        content.includes("**Design Doc**") ||
        content.includes("Linked Design");

      if (!hasDesignRef) {
        result.success = false;
        result.missing.push(relPath);
        result.details.push(`${relPath}: No design doc reference`);
      }
    }
  }

  return result;
}

/**
 * Check design docs reference ADRs
 */
function validateDesignToAdr() {
  const result = { success: true, checked: 0, missing: [], details: [] };

  const designDir = join(projectRoot, "docs/design");
  if (!existsSync(designDir)) {
    return result;
  }

  const docs = findFiles(designDir, /\.md$/);

  for (const docPath of docs) {
    const content = readFileSync(docPath, "utf-8");
    const relPath = relative(projectRoot, docPath);

    // Skip meta-docs
    if (relPath.includes("DEVELOPMENT_PIPELINE")) continue;

    result.checked++;

    // Check for ADR reference
    const hasAdrRef =
      /ADR-\d{3}/.test(content) ||
      content.includes("docs/adr/") ||
      content.includes("**Linked ADR**") ||
      content.includes("## ADR");

    if (!hasAdrRef) {
      result.success = false;
      result.missing.push(relPath);
      result.details.push(`${relPath}: No ADR reference`);
    }
  }

  return result;
}

/**
 * Check ADRs in done/ reference source files
 */
function validateAdrToSource() {
  const result = { success: true, checked: 0, missing: [], details: [] };

  const adrDir = join(projectRoot, "docs/adr/done");
  if (!existsSync(adrDir)) {
    return result;
  }

  const adrs = findFiles(adrDir, /\.md$/);

  for (const adrPath of adrs) {
    const content = readFileSync(adrPath, "utf-8");
    const relPath = relative(projectRoot, adrPath);

    result.checked++;

    // Check for Implementation section with actual file references
    const hasImplSection = content.includes("## Implementation");
    const implMatch = content.match(/## Implementation\n([\s\S]*?)(?=\n##|$)/);

    let hasSourceRef = false;
    if (implMatch) {
      const implSection = implMatch[1];
      // Check for actual source file references (not placeholders)
      hasSourceRef =
        (implSection.includes("packages/") ||
          implSection.includes("src/") ||
          implSection.includes(".ts") ||
          implSection.includes(".mjs")) &&
        !implSection.includes("[Added when") &&
        !implSection.includes("{{");
    }

    if (!hasImplSection || !hasSourceRef) {
      result.success = false;
      result.missing.push(relPath);
      result.details.push(`${relPath}: No source file references in Implementation section`);
    }
  }

  return result;
}

/**
 * Check source files reference their governing ADR
 */
function validateSourceToAdr() {
  const result = { success: true, checked: 0, missing: [], details: [] };

  const srcDir = join(projectRoot, "packages");
  if (!existsSync(srcDir)) {
    return result;
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

  for (const filePath of shouldHaveAdr) {
    const content = readFileSync(filePath, "utf-8");
    const relPath = relative(projectRoot, filePath);

    result.checked++;

    if (!ADR_PATTERN.test(content)) {
      result.success = false;
      result.missing.push(relPath);
      result.details.push(`${relPath}: No ADR reference`);
    }
  }

  return result;
}

// Run all validations
console.log("🔗 Running complete traceability validation...\n");

const requestToDesign = validateRequestToDesign();
const designToAdr = validateDesignToAdr();
const adrToSource = validateAdrToSource();
const sourceToAdr = validateSourceToAdr();

// Build report
const checks = {
  requestToDesign: {
    success: requestToDesign.success,
    message: requestToDesign.success
      ? `✅ Request → Design: All ${requestToDesign.checked} request(s) reference design docs`
      : `❌ Request → Design: ${requestToDesign.missing.length}/${requestToDesign.checked} request(s) missing design doc links`,
  },
  designToAdr: {
    success: designToAdr.success,
    message: designToAdr.success
      ? `✅ Design → ADR: All ${designToAdr.checked} design doc(s) reference ADRs`
      : `❌ Design → ADR: ${designToAdr.missing.length}/${designToAdr.checked} design doc(s) missing ADR links`,
  },
  adrToSource: {
    success: adrToSource.success,
    message: adrToSource.success
      ? `✅ ADR → Source: All ${adrToSource.checked} done ADR(s) reference source files`
      : `❌ ADR → Source: ${adrToSource.missing.length}/${adrToSource.checked} done ADR(s) missing source references`,
  },
  sourceToAdr: {
    success: sourceToAdr.success,
    message: sourceToAdr.success
      ? `✅ Source → ADR: All ${sourceToAdr.checked} source file(s) reference ADRs`
      : `❌ Source → ADR: ${sourceToAdr.missing.length}/${sourceToAdr.checked} source file(s) missing ADR references`,
  },
};

const allSuccess = Object.values(checks).every((check) => check.success);

// Print report
console.log("=".repeat(REPORT_SEPARATOR_LENGTH));
console.log("TRACEABILITY VALIDATION REPORT");
console.log("=".repeat(REPORT_SEPARATOR_LENGTH) + "\n");

console.log(checks.requestToDesign.message);
console.log(checks.designToAdr.message);
console.log(checks.adrToSource.message);
console.log(checks.sourceToAdr.message);

// Print details for failures
const allDetails = [
  ...requestToDesign.details,
  ...designToAdr.details,
  ...adrToSource.details,
  ...sourceToAdr.details,
];

if (allDetails.length > 0) {
  console.log(`\n${CYAN}Details:${NC}`);
  for (const detail of allDetails) {
    console.log(`  ${YELLOW}• ${detail}${NC}`);
  }
}

console.log("\n" + "=".repeat(REPORT_SEPARATOR_LENGTH));
if (allSuccess) {
  console.log(`${GREEN}✅ Complete traceability chain validated successfully!${NC}`);
} else {
  console.log(`${RED}❌ Traceability chain has gaps. See details above.${NC}`);
}
console.log("=".repeat(REPORT_SEPARATOR_LENGTH) + "\n");

if (!allSuccess) {
  console.log("Run individual validation commands for more details:");
  if (!checks.requestToDesign.success || !checks.designToAdr.success) {
    console.log("  pnpm validate:links");
  }
  if (!checks.adrToSource.success || !checks.sourceToAdr.success) {
    console.log("  pnpm validate:adr-traceability");
  }
  console.log();
}

process.exit(allSuccess ? 0 : 1);
