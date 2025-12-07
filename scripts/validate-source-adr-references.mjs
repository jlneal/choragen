#!/usr/bin/env node
/**
 * Validate source file ADR references
 *
 * Checks:
 * 1. Source files in packages/ have ADR reference comments
 * 2. Scripts in scripts/*.mjs have ADR references
 * 3. GitHub workflows in .github/workflows/*.yml have ADR references
 * 4. ESLint config (eslint.config.mjs) has ADR reference
 * 5. Git hooks in githooks/* have ADR references
 * 6. Reports files missing ADR references
 * 7. Supports exemptions via choragen.governance.yaml
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

// File type configurations with their ADR comment patterns
const FILE_TYPE_CONFIGS = {
  // TypeScript source files in packages
  typescript: {
    scanDirs: ["packages"],
    extensions: [".ts", ".tsx", ".mts"],
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
    adrPatterns: [
      /(?:\/\/|\/\*|\*)\s*(?:ADR:|@adr)\s*(ADR-\d{3}-[\w-]+)/,
      /ADR References?:/i,
      /docs\/adr\/\d{4}-/,
      /docs\/adr\/ADR-\d{3}-/,
    ],
    commentFormat: "// ADR: ADR-xxx or * ADR: ADR-xxx (JSDoc)",
  },

  // JavaScript/MJS scripts
  scripts: {
    scanDirs: ["scripts"],
    extensions: [".mjs"],
    excludePatterns: [],
    adrPatterns: [
      /\*\s*ADR:\s*(ADR-\d{3}-[\w-]+)/, // JSDoc: * ADR: ADR-xxx
      /\/\/\s*ADR:\s*(ADR-\d{3}-[\w-]+)/, // Single line: // ADR: ADR-xxx
    ],
    commentFormat: "* ADR: ADR-xxx (in JSDoc header)",
  },

  // ESLint config (root level)
  eslintConfig: {
    specificFiles: ["eslint.config.mjs"],
    adrPatterns: [
      /\*\s*ADR:\s*(ADR-\d{3}-[\w-]+)/, // JSDoc: * ADR: ADR-xxx
    ],
    commentFormat: "* ADR: ADR-xxx (in JSDoc header)",
  },

  // GitHub workflows
  workflows: {
    scanDirs: [".github/workflows"],
    extensions: [".yml", ".yaml"],
    excludePatterns: [],
    adrPatterns: [
      /#\s*ADR:\s*(ADR-\d{3}-[\w-]+)/, // YAML comment: # ADR: ADR-xxx
    ],
    commentFormat: "# ADR: ADR-xxx",
  },

  // Git hooks
  githooks: {
    scanDirs: ["githooks"],
    extensions: [], // No extension filter - check all files
    excludePatterns: [
      /AGENTS\.md$/,
      /\.md$/,
    ],
    adrPatterns: [
      /#\s*ADR:\s*(ADR-\d{3}-[\w-]+)/, // Shell comment: # ADR: ADR-xxx
    ],
    commentFormat: "# ADR: ADR-xxx",
  },
};

// Legacy CONFIG for backward compatibility
const CONFIG = {
  scanLineLimit: 50,
};

let warnings = 0;
let exemptPatterns = [];

/**
 * Parse exemption patterns from YAML content (custom parser, no external deps)
 * Looks for:
 *   validation:
 *     source-adr-references:
 *       exempt-patterns:
 *         - pattern: "..."
 *           category: "..."
 *           justification: "..."
 */
function parseExemptionYaml(content) {
  const exemptPatterns = [];
  const lines = content.split("\n");

  let inValidation = false;
  let inSourceAdrReferences = false;
  let inExemptPatterns = false;
  let currentEntry = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith("#") || trimmed === "") {
      continue;
    }

    // Check for section headers
    if (line.match(/^validation:/)) {
      inValidation = true;
      continue;
    }
    if (inValidation && line.match(/^\s+source-adr-references:/)) {
      inSourceAdrReferences = true;
      continue;
    }
    if (inSourceAdrReferences && line.match(/^\s+exempt-patterns:/)) {
      inExemptPatterns = true;
      continue;
    }

    // Exit sections on dedent
    if (inExemptPatterns && !line.startsWith(" ") && !line.startsWith("\t")) {
      inExemptPatterns = false;
      inSourceAdrReferences = false;
      inValidation = false;
    }

    // Parse exempt pattern entries
    if (inExemptPatterns) {
      // New entry starts with "- pattern:"
      const patternMatch = trimmed.match(/^-\s*pattern:\s*["']?([^"']+)["']?$/);
      if (patternMatch) {
        if (currentEntry) {
          exemptPatterns.push(currentEntry);
        }
        currentEntry = { pattern: patternMatch[1] };
        continue;
      }

      // Category line
      const categoryMatch = trimmed.match(/^category:\s*["']?([^"']+)["']?$/);
      if (categoryMatch && currentEntry) {
        currentEntry.category = categoryMatch[1];
        continue;
      }

      // Justification line
      const justificationMatch = trimmed.match(
        /^justification:\s*["']?([^"']+)["']?$/
      );
      if (justificationMatch && currentEntry) {
        currentEntry.justification = justificationMatch[1];
        continue;
      }
    }
  }

  // Don't forget the last entry
  if (currentEntry) {
    exemptPatterns.push(currentEntry);
  }

  return exemptPatterns;
}

/**
 * Load exemption patterns from choragen.governance.yaml
 */
function loadExemptions() {
  const governancePath = join(projectRoot, "choragen.governance.yaml");
  if (!existsSync(governancePath)) return [];

  try {
    const content = readFileSync(governancePath, "utf-8");
    const exemptions = parseExemptionYaml(content);
    return exemptions.map((e) => ({
      pattern: e.pattern,
      regex: new RegExp(e.pattern.replace(/\*/g, ".*")),
      category: e.category || "unspecified",
      justification: e.justification || "",
    }));
  } catch (err) {
    console.log(`${YELLOW}  Warning: Could not parse governance file: ${err.message}${NC}`);
    return [];
  }
}

/**
 * Check if a file path is exempt from ADR reference requirement
 */
function isExempt(relPath) {
  return exemptPatterns.find((e) => e.regex.test(relPath));
}

/**
 * Recursively find all files matching criteria for a specific file type config
 */
function findFilesForConfig(typeConfig, files = []) {
  // Handle specific files (like eslint.config.mjs)
  if (typeConfig.specificFiles) {
    for (const fileName of typeConfig.specificFiles) {
      const fullPath = join(projectRoot, fileName);
      if (existsSync(fullPath)) {
        files.push({ path: fullPath, config: typeConfig });
      }
    }
    return files;
  }

  // Handle directory scanning
  for (const scanDir of typeConfig.scanDirs || []) {
    const fullDir = join(projectRoot, scanDir);
    if (!existsSync(fullDir)) continue;

    findFilesInDir(fullDir, typeConfig, files);
  }

  return files;
}

/**
 * Recursively find files in a directory
 */
function findFilesInDir(dir, typeConfig, files = []) {
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
        findFilesInDir(fullPath, typeConfig, files);
      }
    } else {
      // Check if file matches criteria
      const extensions = typeConfig.extensions || [];
      const hasValidExtension =
        extensions.length === 0 || extensions.some((ext) => entry.name.endsWith(ext));
      const excludePatterns = typeConfig.excludePatterns || [];
      const isExcluded = excludePatterns.some((pattern) => pattern.test(relPath));

      if (hasValidExtension && !isExcluded) {
        files.push({ path: fullPath, config: typeConfig });
      }
    }
  }
  return files;
}

/**
 * Check if file has ADR reference in first N lines using type-specific patterns
 */
function hasAdrReference(filePath, adrPatterns) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").slice(0, CONFIG.scanLineLimit);
  const headerContent = lines.join("\n");

  return adrPatterns.some((pattern) => pattern.test(headerContent));
}

/**
 * Extract ADR reference from file if present using type-specific patterns
 */
function extractAdrReference(filePath, adrPatterns) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").slice(0, CONFIG.scanLineLimit);
  const headerContent = lines.join("\n");

  // Try each pattern to extract ADR ID
  for (const pattern of adrPatterns) {
    const match = headerContent.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Fallback: try generic patterns
  const genericMatch = headerContent.match(/(?:ADR:|@adr)\s*(ADR-\d{3}-[\w-]+)/);
  if (genericMatch) {
    return genericMatch[1];
  }

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

  // Load exemptions
  exemptPatterns = loadExemptions();
  if (exemptPatterns.length > 0) {
    console.log(`  Loaded ${exemptPatterns.length} exemption pattern(s) from governance file\n`);
  }

  const allFiles = [];

  // Collect files from all file type configurations
  for (const [typeName, typeConfig] of Object.entries(FILE_TYPE_CONFIGS)) {
    const files = findFilesForConfig(typeConfig);
    if (files.length > 0) {
      console.log(`  ${typeName}: found ${files.length} file(s)`);
    }
    allFiles.push(...files);
  }

  console.log("");

  if (allFiles.length === 0) {
    console.log(`${YELLOW}  No source files found to check${NC}`);
    return { total: 0, withRefs: 0, missing: 0, exempt: 0, files: [], byType: {} };
  }

  const filesWithRefs = [];
  const filesMissingRefs = [];
  const filesExempt = [];
  const resultsByType = {};

  for (const { path: filePath, config } of allFiles) {
    const relPath = relative(projectRoot, filePath);
    const adrPatterns = config.adrPatterns;

    // Check exemption first
    const exemption = isExempt(relPath);
    if (exemption) {
      filesExempt.push({ path: relPath, reason: exemption.justification });
      continue;
    }

    if (hasAdrReference(filePath, adrPatterns)) {
      const adrRef = extractAdrReference(filePath, adrPatterns);
      filesWithRefs.push({ path: relPath, adr: adrRef });
    } else {
      filesMissingRefs.push({ path: relPath, format: config.commentFormat });
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

  // Report exempt files
  if (filesExempt.length > 0) {
    console.log(`\n${YELLOW}  Exempt files:${NC}`);
    for (const file of filesExempt) {
      console.log(`    ⊘ ${file.path}`);
      if (file.reason) {
        console.log(`      Reason: ${file.reason}`);
      }
    }
  }

  // Report files missing references with format hints
  if (filesMissingRefs.length > 0) {
    console.log(`\n${YELLOW}  Files missing ADR references:${NC}`);
    for (const file of filesMissingRefs) {
      console.log(`    ○ ${file.path}`);
      console.log(`      Expected format: ${file.format}`);
    }
  }

  return {
    total: allFiles.length,
    withRefs: filesWithRefs.length,
    missing: filesMissingRefs.length,
    exempt: filesExempt.length,
    files: filesMissingRefs.map((f) => f.path),
  };
}

/**
 * Print usage instructions for adding ADR references
 */
function printUsageInstructions() {
  console.log(`\n${YELLOW}To add ADR references, use the appropriate format for each file type:${NC}`);
  console.log(`
  TypeScript/JavaScript (.ts, .mjs):
    // ADR: ADR-001-task-file-format
    // or in JSDoc:
    /**
     * ADR: ADR-001-task-file-format
     */

  YAML workflows (.yml):
    # ADR: ADR-001-task-file-format

  Shell scripts (githooks/*):
    # ADR: ADR-001-task-file-format

  To exempt a file, add to choragen.governance.yaml:
    validation:
      source-adr-references:
        exempt-patterns:
          - pattern: "path/to/file"
            category: "reason-category"
            justification: "Why this file is exempt"
`);
}

// Run validation
console.log("🔗 Validating source file ADR references...");

const stats = validateSourceAdrReferences();

// Summary
console.log("\n" + "=".repeat(50));

if (stats.total > 0) {
  const effectiveTotal = stats.total - stats.exempt;
  const coveragePercent =
    effectiveTotal > 0 ? Math.round((stats.withRefs / effectiveTotal) * 100) : 100;

  console.log(`\nADR Reference Coverage: ${coveragePercent}%`);
  console.log(`  Total files checked: ${stats.total}`);
  console.log(`  With ADR references: ${stats.withRefs}`);
  console.log(`  Missing references: ${stats.missing}`);
  if (stats.exempt > 0) {
    console.log(`  Exempt files: ${stats.exempt}`);
  }
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
