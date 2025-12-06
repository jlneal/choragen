#!/usr/bin/env node
/**
 * Validates that design documents have required sections filled in
 *
 * Checks:
 * 1. Personas have required sections (Overview, Characteristics)
 * 2. Scenarios have required sections (User Story, Acceptance Criteria)
 * 3. Use-cases have required sections (User Goal, Acceptance Criteria)
 * 4. Features have required sections (Overview, Acceptance Criteria)
 * 5. Enhancements have required sections (Overview, Acceptance Criteria)
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
const DESIGN_DIR = join(projectRoot, "docs/design");

// Section name alternatives - any of these satisfy the requirement
const SECTION_ALTERNATIVES = {
  Overview: [
    "Overview",
    "Purpose",
    "Description",
    "What",
    "Background",
    "Summary",
    "Context",
    "User Intent",
  ],
  "User Story": [
    "User Story",
    "User Goal",
    "Goal",
    "Overview",
    "Purpose",
    "Description",
  ],
  "User Goal": [
    "User Goal",
    "User Story",
    "Goal",
    "Overview",
    "Purpose",
    "Description",
  ],
  "Acceptance Criteria": [
    "Acceptance Criteria",
    "Acceptance Tests",
    "Success Criteria",
    "Validation",
    "Verification",
    "How to Verify",
    "Testing",
  ],
  "Success Criteria": [
    "Success Criteria",
    "Acceptance Criteria",
    "Acceptance Tests",
    "Validation",
    "Verification",
  ],
  Characteristics: [
    "Characteristics",
    "Traits",
    "Attributes",
    "Profile",
    "Description",
    "Overview",
  ],
  "Current State": [
    "Current State",
    "Problem",
    "Problem Statement",
    "Background",
    "Context",
    "Overview",
  ],
  "Desired State": [
    "Desired State",
    "Proposed Solution",
    "Solution",
    "Goal",
    "Target State",
  ],
};

// Design doc types and their required sections
const DESIGN_DOC_TYPES = {
  personas: {
    requiredSections: ["Overview", "Characteristics"],
    optionalSections: [],
  },
  scenarios: {
    requiredSections: ["User Story", "Acceptance Criteria"],
    optionalSections: ["Linked Features"],
  },
  "use-cases": {
    requiredSections: ["User Goal", "Acceptance Criteria"],
    optionalSections: ["Linked ADRs"],
  },
  features: {
    requiredSections: ["Overview", "Acceptance Criteria"],
    optionalSections: ["Linked ADRs", "Linked Scenarios", "Implementation"],
  },
  enhancements: {
    requiredSections: ["Current State", "Desired State", "Acceptance Criteria"],
    optionalSections: ["Linked ADRs", "Implementation Notes"],
  },
};

// Placeholder patterns that indicate unfilled sections
const PLACEHOLDER_PATTERNS = [
  /^\[.*\]$/m, // [placeholder text]
  /^TODO$/im, // TODO
  /^TBD$/im, // TBD
  /^- Item 1$/m, // Template default
  /^- TODO$/m, // List item TODO
  /^None$/im, // None without explanation
  /^\{\{.*\}\}$/m, // {{TEMPLATE_VAR}}
];

/**
 * Check if content is a placeholder or empty
 */
function isPlaceholder(content) {
  const trimmed = content.trim();
  if (!trimmed || trimmed.length === 0) {
    return true;
  }
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Extract section content from markdown
 */
function extractSection(content, sectionName) {
  // Match ## Section Name or ### Section Name followed by content until next ## or ---
  const pattern = new RegExp(
    `##+\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##+\\s|\\n---|$)`,
    "i"
  );
  const match = content.match(pattern);
  return match ? match[1].trim() : null;
}

/**
 * Get the doc type from file path
 */
function getDocType(filePath) {
  for (const docType of Object.keys(DESIGN_DOC_TYPES)) {
    if (filePath.includes(`/${docType}/`)) {
      return docType;
    }
  }
  return null;
}

/**
 * Find a section by checking alternatives
 */
function findSection(content, sectionName) {
  const alternatives = SECTION_ALTERNATIVES[sectionName] ?? [sectionName];

  for (const altName of alternatives) {
    const section = extractSection(content, altName);
    if (section !== null) {
      return { found: true, content: section, matchedName: altName };
    }
  }

  return { found: false, content: null, matchedName: null };
}

/**
 * Validate a single design doc file
 */
function validateDesignDocFile(filePath) {
  const errors = [];
  const content = readFileSync(filePath, "utf-8");
  const docType = getDocType(filePath);

  if (!docType) {
    return errors; // Not a design doc type we validate
  }

  const config = DESIGN_DOC_TYPES[docType];

  // Check required sections
  for (const sectionName of config.requiredSections) {
    const result = findSection(content, sectionName);
    if (!result.found) {
      const alternatives = SECTION_ALTERNATIVES[sectionName] ?? [sectionName];
      errors.push({
        file: filePath,
        section: sectionName,
        reason: `Required section missing. Expected one of: ${alternatives.join(", ")}`,
      });
    } else if (result.content && isPlaceholder(result.content)) {
      errors.push({
        file: filePath,
        section: result.matchedName ?? sectionName,
        reason: "Section is empty or contains placeholder text",
      });
    }
  }

  return errors;
}

/**
 * Recursively collect design docs
 */
function collectDesignDocs(baseDir) {
  const files = [];

  function walkDir(dir) {
    if (!existsSync(dir)) return;

    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip archive and templates directories
          if (entry === "archive" || entry === "templates") {
            continue;
          }
          walkDir(fullPath);
        } else if (entry.endsWith(".md") && getDocType(fullPath)) {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory doesn't exist or can't be read, skip
    }
  }

  walkDir(baseDir);
  return files;
}

/**
 * Main validation function
 */
function validateDesignDocContent() {
  const allErrors = [];
  let checkedFiles = 0;

  const designDocs = collectDesignDocs(DESIGN_DIR);

  for (const file of designDocs) {
    checkedFiles++;
    const errors = validateDesignDocFile(file);
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

// Run validation
console.log("📄 Validating design doc content...\n");

const result = validateDesignDocContent();

if (result.errors.length > 0) {
  console.log(`${RED}❌ Design doc content validation failed:${NC}\n`);

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
      console.log(`${YELLOW}    - ${error.section}: ${error.reason}${NC}`);
    }
    console.log();
  }
}

// Summary
console.log("=".repeat(50));
if (result.success) {
  console.log(
    `${GREEN}✅ Design doc content validation passed (${result.validFiles}/${result.checkedFiles} files)${NC}`
  );
  process.exit(0);
} else {
  console.log(
    `${RED}❌ Design doc content validation failed (${result.validFiles}/${result.checkedFiles} valid)${NC}`
  );
  process.exit(1);
}
