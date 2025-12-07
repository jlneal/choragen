#!/usr/bin/env node
/**
 * Validates user value traceability across the documentation chain.
 *
 * Checks:
 * 1. Scenarios have linked personas (warning)
 * 2. Use cases have linked scenarios (warning)
 * 3. Features have linked scenarios or use cases (error)
 * 4. CRs have linked feature documents (error)
 *
 * Exemption handling:
 * - Pattern-based exemptions from choragen.governance.yaml
 * - Inline markers (@exempt user-value-traceability)
 * - Validates exemption categories and justifications
 *
 * ADR: ADR-001-task-file-format
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const NC = "\x1b[0m";

const projectRoot = process.cwd();
const args = process.argv.slice(2);
const listExemptionsMode = args.includes("--list-exemptions");

// Valid exemption categories
const VALID_CATEGORIES = [
  "build-tooling",
  "ci-cd",
  "generated",
  "framework-docs",
  "internal-utility",
  "legacy",
];

// Placeholder patterns for justifications that are rejected
const INVALID_JUSTIFICATION_PATTERNS = [
  /^TODO$/i,
  /^TBD$/i,
  /^FIXME$/i,
  /^\[.*\]$/,
  /^\{\{.*\}\}$/,
  /^add justification/i,
  /^placeholder/i,
  /^exempt$/i,
  /^internal$/i,
  /^not needed$/i,
];

// File patterns
const PATTERNS = {
  scenarios: "docs/design/*/scenarios/*.md",
  useCases: "docs/design/*/use-cases/*.md",
  features: "docs/design/*/features/*.md",
  changeRequests: "docs/requests/change-requests/*/*.md",
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
 * Simple glob pattern matching (supports * and **)
 */
function matchGlob(pattern, filePath) {
  // Normalize path separators
  const normalizedPath = filePath.replace(/\\/g, "/");
  const normalizedPattern = pattern.replace(/\\/g, "/");

  // Convert glob pattern to regex
  let regexPattern = normalizedPattern
    .replace(/\./g, "\\.") // Escape dots
    .replace(/\*\*/g, "__DOUBLE_STAR__") // Temporarily replace **
    .replace(/\*/g, "[^/]*") // * matches anything except /
    .replace(/__DOUBLE_STAR__/g, ".*"); // ** matches anything including /

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(normalizedPath);
}

/**
 * Parse a simple YAML structure for exemption patterns
 * Only handles the specific structure we need:
 * validation:
 *   user-value-traceability:
 *     exempt-patterns:
 *       - pattern: "..."
 *         category: "..."
 *         justification: "..."
 */
function parseExemptionYaml(content) {
  const exemptPatterns = [];
  const lines = content.split("\n");

  let inValidation = false;
  let inUserValueTraceability = false;
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
    if (inValidation && line.match(/^\s+user-value-traceability:/)) {
      inUserValueTraceability = true;
      continue;
    }
    if (inUserValueTraceability && line.match(/^\s+exempt-patterns:/)) {
      inExemptPatterns = true;
      continue;
    }

    // Exit sections on dedent
    if (inExemptPatterns && !line.startsWith(" ") && !line.startsWith("\t")) {
      inExemptPatterns = false;
      inUserValueTraceability = false;
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
 * Load exemption configuration from choragen.governance.yaml
 */
function loadExemptionConfig() {
  const configPath = join(projectRoot, "choragen.governance.yaml");
  if (!existsSync(configPath)) {
    return { patterns: [], errors: [] };
  }

  try {
    const content = readFileSync(configPath, "utf-8");
    const exemptPatterns = parseExemptionYaml(content);
    const patterns = [];
    const errors = [];

    for (const entry of exemptPatterns) {
      if (!entry.pattern) {
        errors.push({
          type: "config",
          message: "Exemption pattern missing 'pattern' field",
          entry,
        });
        continue;
      }
      if (!entry.category) {
        errors.push({
          type: "config",
          message: `Exemption pattern "${entry.pattern}" missing 'category' field`,
          entry,
        });
        continue;
      }
      if (!VALID_CATEGORIES.includes(entry.category)) {
        errors.push({
          type: "config",
          message: `Exemption pattern "${entry.pattern}" has invalid category "${entry.category}"`,
          validCategories: VALID_CATEGORIES,
          entry,
        });
        continue;
      }
      if (!entry.justification) {
        errors.push({
          type: "config",
          message: `Exemption pattern "${entry.pattern}" missing 'justification' field`,
          entry,
        });
        continue;
      }
      if (isInvalidJustification(entry.justification)) {
        errors.push({
          type: "config",
          message: `Exemption pattern "${entry.pattern}" has placeholder justification`,
          entry,
        });
        continue;
      }

      patterns.push({
        pattern: entry.pattern,
        category: entry.category,
        justification: entry.justification,
      });
    }

    return { patterns, errors };
  } catch (err) {
    return {
      patterns: [],
      errors: [
        {
          type: "config",
          message: `Failed to parse choragen.governance.yaml: ${err.message}`,
        },
      ],
    };
  }
}

/**
 * Check if a justification is invalid (placeholder or too vague)
 */
function isInvalidJustification(justification) {
  if (!justification || justification.trim().length === 0) {
    return true;
  }
  const trimmed = justification.trim();
  return INVALID_JUSTIFICATION_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Check if a file matches any pattern-based exemption
 */
function matchesPatternExemption(filePath, patterns) {
  const relativePath = relative(projectRoot, filePath);
  for (const exemption of patterns) {
    if (matchGlob(exemption.pattern, relativePath)) {
      return exemption;
    }
  }
  return null;
}

/**
 * Remove code blocks from markdown content to avoid false positives
 */
function stripCodeBlocks(content) {
  // Remove fenced code blocks (```...```)
  return content.replace(/```[\s\S]*?```/g, "");
}

/**
 * Parse inline exemption markers from file content
 * Supports:
 * - JS/TS: block comment or line comment with @exempt user-value-traceability
 * - Markdown: <!-- @exempt user-value-traceability -->
 * - YAML: # @exempt user-value-traceability
 *
 * For markdown files, markers inside code blocks are ignored.
 * Markers must appear in the first 50 lines of the file to be valid.
 */
function parseInlineExemption(content, filePath) {
  const ext = filePath.split(".").pop()?.toLowerCase();

  // For markdown files, strip code blocks to avoid false positives from examples
  let searchContent = content;
  if (ext === "md") {
    searchContent = stripCodeBlocks(content);
  }

  // Only look in the first 50 lines for exemption markers
  const lines = searchContent.split("\n").slice(0, 50);
  const headerContent = lines.join("\n");

  // Check for @exempt user-value-traceability marker
  const exemptMarkerPatterns = [
    /@exempt\s+user-value-traceability/i,
  ];

  let hasExemptMarker = false;
  for (const pattern of exemptMarkerPatterns) {
    if (pattern.test(headerContent)) {
      hasExemptMarker = true;
      break;
    }
  }

  if (!hasExemptMarker) {
    return null;
  }

  // Extract category (from header content only)
  const categoryMatch = headerContent.match(/@exempt-category\s+([\w-]+)/i);
  const category = categoryMatch ? categoryMatch[1] : null;

  // Extract reason (from header content only)
  const reasonMatch = headerContent.match(/@exempt-reason\s+(.+?)(?:\n|\*\/|-->|$)/i);
  const reason = reasonMatch ? reasonMatch[1].trim() : null;

  return {
    hasMarker: true,
    category,
    reason,
    filePath: relative(projectRoot, filePath),
  };
}

/**
 * Validate an inline exemption and return any errors
 */
function validateInlineExemption(exemption) {
  const errors = [];

  if (!exemption.category) {
    errors.push({
      type: "inline",
      filePath: exemption.filePath,
      message: "Inline exemption missing @exempt-category",
    });
  } else if (!VALID_CATEGORIES.includes(exemption.category)) {
    errors.push({
      type: "inline",
      filePath: exemption.filePath,
      message: `Invalid exemption category "${exemption.category}"`,
      validCategories: VALID_CATEGORIES,
    });
  }

  if (!exemption.reason) {
    errors.push({
      type: "inline",
      filePath: exemption.filePath,
      message: "Inline exemption missing @exempt-reason",
    });
  } else if (isInvalidJustification(exemption.reason)) {
    errors.push({
      type: "inline",
      filePath: exemption.filePath,
      message: "Inline exemption has placeholder or invalid justification",
    });
  }

  return errors;
}

/**
 * Check if a file is exempted (either by pattern or inline marker)
 * Returns { exempted: boolean, exemption?: object, errors?: array }
 */
function checkExemption(filePath, content, patternExemptions) {
  // Check pattern-based exemption first
  const patternMatch = matchesPatternExemption(filePath, patternExemptions);
  if (patternMatch) {
    return {
      exempted: true,
      exemption: {
        type: "pattern",
        ...patternMatch,
        filePath: relative(projectRoot, filePath),
      },
      errors: [],
    };
  }

  // Check inline exemption
  const inlineExemption = parseInlineExemption(content, filePath);
  if (inlineExemption) {
    const validationErrors = validateInlineExemption(inlineExemption);
    if (validationErrors.length > 0) {
      return {
        exempted: false,
        exemption: inlineExemption,
        errors: validationErrors,
      };
    }
    return {
      exempted: true,
      exemption: {
        type: "inline",
        ...inlineExemption,
      },
      errors: [],
    };
  }

  return { exempted: false, errors: [] };
}

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
  // Match ## Section Name followed by content until next ## or ---
  const pattern = new RegExp(
    `##\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|\\n---|$)`,
    "i"
  );
  const match = content.match(pattern);
  return match ? match[1].trim() : null;
}

/**
 * Check if section has at least one list item
 */
function hasListItem(sectionContent) {
  if (!sectionContent) return false;
  // Match markdown list items (- or *)
  return /^[\s]*[-*]\s+.+/m.test(sectionContent);
}

/**
 * Check if section contains a link to a specific path pattern
 */
function hasLinkToPath(sectionContent, pathPattern) {
  if (!sectionContent) return false;
  // Match markdown links containing the path pattern
  const linkRegex = new RegExp(`\\[.*?\\]\\(.*?${pathPattern}.*?\\)`, "i");
  // Also match plain text references
  const plainRegex = new RegExp(pathPattern, "i");
  return linkRegex.test(sectionContent) || plainRegex.test(sectionContent);
}

/**
 * Recursively collect files matching a glob-like pattern
 */
function collectFiles(baseDir, pattern) {
  const files = [];
  const parts = pattern.split("/");

  function walkDir(dir, partIndex) {
    if (!existsSync(dir)) return;

    try {
      const entries = readdirSync(dir);
      const currentPart = parts[partIndex];

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          if (currentPart === "*" || currentPart === entry) {
            walkDir(fullPath, partIndex + 1);
          }
        } else if (stat.isFile()) {
          // Check if we're at the file level
          if (partIndex === parts.length - 1) {
            if (currentPart === "*.md" && entry.endsWith(".md")) {
              files.push(fullPath);
            } else if (currentPart === entry) {
              files.push(fullPath);
            }
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read, skip
    }
  }

  walkDir(baseDir, 0);
  return files;
}

/**
 * Format error message according to spec
 */
function formatError(ruleNum, description, filePath, expected, found, fix) {
  const relativePath = relative(projectRoot, filePath);
  return {
    ruleNum,
    description,
    filePath: relativePath,
    expected,
    found,
    fix,
  };
}

/**
 * Rule 1: Scenario → Persona (Warning)
 */
function validateRule1(files, patternExemptions, exemptionTracker) {
  const results = { passed: 0, failed: 0, errors: [], skipped: 0 };

  for (const file of files) {
    const content = readFileSync(file, "utf-8");

    // Check exemption
    const exemptionResult = checkExemption(file, content, patternExemptions);
    if (exemptionResult.errors.length > 0) {
      exemptionTracker.errors.push(...exemptionResult.errors);
    }
    if (exemptionResult.exempted) {
      exemptionTracker.exemptions.push(exemptionResult.exemption);
      results.skipped++;
      continue;
    }
    const section = extractSection(content, "Linked Personas");

    if (!section) {
      results.failed++;
      results.errors.push(
        formatError(
          1,
          "Scenario missing linked persona",
          file,
          'Non-empty "Linked Personas" section',
          "Section missing",
          'Add "## Linked Personas" section with at least one persona reference'
        )
      );
    } else if (!hasListItem(section) || isPlaceholder(section)) {
      results.failed++;
      results.errors.push(
        formatError(
          1,
          "Scenario missing linked persona",
          file,
          'Non-empty "Linked Personas" section',
          "Section empty or contains placeholder",
          'Add at least one persona reference to "## Linked Personas" section'
        )
      );
    } else {
      results.passed++;
    }
  }

  return results;
}

/**
 * Rule 2: Use Case → Scenario (Warning)
 */
function validateRule2(files, patternExemptions, exemptionTracker) {
  const results = { passed: 0, failed: 0, errors: [], skipped: 0 };

  for (const file of files) {
    const content = readFileSync(file, "utf-8");

    // Check exemption
    const exemptionResult = checkExemption(file, content, patternExemptions);
    if (exemptionResult.errors.length > 0) {
      exemptionTracker.errors.push(...exemptionResult.errors);
    }
    if (exemptionResult.exempted) {
      exemptionTracker.exemptions.push(exemptionResult.exemption);
      results.skipped++;
      continue;
    }

    // Check for either "Related Scenarios" or "Linked Scenarios"
    const relatedSection = extractSection(content, "Related Scenarios");
    const linkedSection = extractSection(content, "Linked Scenarios");
    const section = relatedSection || linkedSection;

    if (!section) {
      results.failed++;
      results.errors.push(
        formatError(
          2,
          "Use case missing linked scenario",
          file,
          'Non-empty "Related Scenarios" or "Linked Scenarios" section',
          "Neither section present",
          'Add "## Related Scenarios" section with at least one scenario reference'
        )
      );
    } else if (!hasListItem(section) || isPlaceholder(section)) {
      results.failed++;
      results.errors.push(
        formatError(
          2,
          "Use case missing linked scenario",
          file,
          'Non-empty "Related Scenarios" or "Linked Scenarios" section',
          "Section empty or contains placeholder",
          "Add at least one scenario reference to the section"
        )
      );
    } else {
      results.passed++;
    }
  }

  return results;
}

/**
 * Rule 3: Feature → Scenario or Use Case (Error)
 */
function validateRule3(files, patternExemptions, exemptionTracker) {
  const results = { passed: 0, failed: 0, errors: [], skipped: 0 };

  for (const file of files) {
    const content = readFileSync(file, "utf-8");

    // Check exemption
    const exemptionResult = checkExemption(file, content, patternExemptions);
    if (exemptionResult.errors.length > 0) {
      exemptionTracker.errors.push(...exemptionResult.errors);
    }
    if (exemptionResult.exempted) {
      exemptionTracker.exemptions.push(exemptionResult.exemption);
      results.skipped++;
      continue;
    }

    const scenariosSection = extractSection(content, "Linked Scenarios");
    const useCasesSection = extractSection(content, "Linked Use Cases");

    const hasScenarios =
      scenariosSection &&
      hasListItem(scenariosSection) &&
      !isPlaceholder(scenariosSection);
    const hasUseCases =
      useCasesSection &&
      hasListItem(useCasesSection) &&
      !isPlaceholder(useCasesSection);

    if (!hasScenarios && !hasUseCases) {
      results.failed++;
      let found = "Neither section present";
      if (scenariosSection || useCasesSection) {
        found = "Section(s) present but empty or contain placeholder";
      }
      results.errors.push(
        formatError(
          3,
          "Feature missing linked scenario or use case",
          file,
          'Non-empty "Linked Scenarios" or "Linked Use Cases" section',
          found,
          'Add "## Linked Scenarios" or "## Linked Use Cases" with at least one reference'
        )
      );
    } else {
      results.passed++;
    }
  }

  return results;
}

/**
 * Rule 4: CR → Feature (Error)
 */
function validateRule4(files, patternExemptions, exemptionTracker) {
  const results = { passed: 0, failed: 0, errors: [], skipped: 0 };

  for (const file of files) {
    const content = readFileSync(file, "utf-8");

    // Check exemption
    const exemptionResult = checkExemption(file, content, patternExemptions);
    if (exemptionResult.errors.length > 0) {
      exemptionTracker.errors.push(...exemptionResult.errors);
    }
    if (exemptionResult.exempted) {
      exemptionTracker.exemptions.push(exemptionResult.exemption);
      results.skipped++;
      continue;
    }
    const section = extractSection(content, "Affected Design Documents");

    if (!section) {
      results.failed++;
      results.errors.push(
        formatError(
          4,
          "CR missing linked feature document",
          file,
          '"Affected Design Documents" section with at least one feature doc reference',
          "Section missing",
          'Add "## Affected Design Documents" section with feature doc reference'
        )
      );
    } else if (!hasListItem(section) || isPlaceholder(section)) {
      results.failed++;
      results.errors.push(
        formatError(
          4,
          "CR missing linked feature document",
          file,
          '"Affected Design Documents" section with at least one feature doc reference',
          "Section empty or contains placeholder",
          "Add at least one feature doc reference to the section"
        )
      );
    } else if (!hasLinkToPath(section, "features/")) {
      results.failed++;
      results.errors.push(
        formatError(
          4,
          "CR missing linked feature document",
          file,
          '"Affected Design Documents" section with at least one feature doc reference',
          "Section has content but no feature doc references",
          'Add a reference to a feature doc (e.g., "docs/design/core/features/xxx.md")'
        )
      );
    } else {
      results.passed++;
    }
  }

  return results;
}

/**
 * Print error in the specified format
 */
function printError(error, isWarning = false) {
  const prefix = isWarning ? `${YELLOW}⚠️` : `${RED}❌`;
  console.log(`${prefix} [RULE-${error.ruleNum}] ${error.description}${NC}`);
  console.log(`   File: ${error.filePath}`);
  console.log(`   Expected: ${error.expected}`);
  console.log(`   Found: ${error.found}`);
  console.log(`   Fix: ${error.fix}`);
  console.log();
}

/**
 * Print exemption errors
 */
function printExemptionError(error) {
  console.log(`${RED}❌ [EXEMPTION] ${error.message}${NC}`);
  console.log(`   File: ${error.filePath || "config"}`);
  if (error.validCategories) {
    console.log(`   Valid categories: ${error.validCategories.join(", ")}`);
  }
  console.log();
}

/**
 * List all exemptions in audit format
 */
function listExemptions(patternExemptions, exemptionTracker) {
  console.log("=".repeat(70));
  console.log(`${CYAN}User Value Traceability Exemptions${NC}`);
  console.log("=".repeat(70));

  // Pattern-based exemptions
  console.log(`\n${CYAN}Pattern-Based Exemptions (from choragen.governance.yaml)${NC}`);
  if (patternExemptions.length === 0) {
    console.log("  (none configured)");
  } else {
    for (const exemption of patternExemptions) {
      // Count matching files
      const matchingFiles = exemptionTracker.exemptions.filter(
        (e) => e.type === "pattern" && e.pattern === exemption.pattern
      );
      console.log(
        `  ${exemption.pattern.padEnd(35)} ${exemption.category.padEnd(18)} ${matchingFiles.length} files`
      );
    }
  }

  // Inline exemptions
  const inlineExemptions = exemptionTracker.exemptions.filter(
    (e) => e.type === "inline"
  );
  console.log(`\n${CYAN}Inline Exemptions${NC}`);
  if (inlineExemptions.length === 0) {
    console.log("  (none found)");
  } else {
    for (const exemption of inlineExemptions) {
      console.log(
        `  ${exemption.filePath.padEnd(45)} ${exemption.category}`
      );
    }
  }

  // Errors
  if (exemptionTracker.errors.length > 0) {
    console.log(`\n${RED}Exemption Errors${NC}`);
    for (const error of exemptionTracker.errors) {
      console.log(`  ❌ ${error.filePath || "config"}: ${error.message}`);
    }
  }

  console.log("=".repeat(70));
}

/**
 * Main validation function
 */
function validateUserValueTraceability() {
  // Load exemption configuration
  const exemptionConfig = loadExemptionConfig();
  const patternExemptions = exemptionConfig.patterns;
  const exemptionTracker = {
    exemptions: [],
    errors: [...exemptionConfig.errors],
  };

  // If --list-exemptions, we still need to scan files to find inline exemptions
  if (listExemptionsMode) {
    console.log(`${CYAN}🔍 Scanning for exemptions...${NC}\n`);
  } else {
    console.log(`${CYAN}🔗 Validating user value traceability...${NC}\n`);
  }

  // Collect files for each pattern
  const scenarioFiles = collectFiles(projectRoot, PATTERNS.scenarios);
  const useCaseFiles = collectFiles(projectRoot, PATTERNS.useCases);
  const featureFiles = collectFiles(projectRoot, PATTERNS.features);
  const crFiles = collectFiles(projectRoot, PATTERNS.changeRequests);

  // Run validation rules (in reverse chain order per design doc)
  const rule4Results = validateRule4(crFiles, patternExemptions, exemptionTracker);
  const rule3Results = validateRule3(featureFiles, patternExemptions, exemptionTracker);
  const rule2Results = validateRule2(useCaseFiles, patternExemptions, exemptionTracker);
  const rule1Results = validateRule1(scenarioFiles, patternExemptions, exemptionTracker);

  // If --list-exemptions mode, just show exemptions and exit
  if (listExemptionsMode) {
    listExemptions(patternExemptions, exemptionTracker);
    process.exit(exemptionTracker.errors.length > 0 ? 1 : 0);
  }

  // Print exemption errors first
  for (const error of exemptionTracker.errors) {
    printExemptionError(error);
  }

  // Print errors (Rules 3-4 are errors, Rules 1-2 are warnings)
  let hasErrors = exemptionTracker.errors.length > 0;
  let hasWarnings = false;

  // Rule 4 errors
  for (const error of rule4Results.errors) {
    printError(error, false);
    hasErrors = true;
  }

  // Rule 3 errors
  for (const error of rule3Results.errors) {
    printError(error, false);
    hasErrors = true;
  }

  // Rule 2 warnings
  for (const error of rule2Results.errors) {
    printError(error, true);
    hasWarnings = true;
  }

  // Rule 1 warnings
  for (const error of rule1Results.errors) {
    printError(error, true);
    hasWarnings = true;
  }

  // Print summary
  console.log("=".repeat(60));
  console.log(`${CYAN}User Value Traceability Validation Results${NC}`);
  console.log("=".repeat(60));

  const rule1Status =
    rule1Results.failed === 0
      ? `${GREEN}✅${NC}`
      : `${YELLOW}⚠️${NC} (${rule1Results.failed} warning${rule1Results.failed > 1 ? "s" : ""})`;
  const rule2Status =
    rule2Results.failed === 0
      ? `${GREEN}✅${NC}`
      : `${YELLOW}⚠️${NC} (${rule2Results.failed} warning${rule2Results.failed > 1 ? "s" : ""})`;
  const rule3Status =
    rule3Results.failed === 0
      ? `${GREEN}✅${NC}`
      : `${RED}❌${NC} (${rule3Results.failed} error${rule3Results.failed > 1 ? "s" : ""})`;
  const rule4Status =
    rule4Results.failed === 0
      ? `${GREEN}✅${NC}`
      : `${RED}❌${NC} (${rule4Results.failed} error${rule4Results.failed > 1 ? "s" : ""})`;

  const formatCount = (r) => {
    const total = r.passed + r.failed;
    const skipped = r.skipped || 0;
    if (skipped > 0) {
      return `${r.passed}/${total} passed (${skipped} exempted)`;
    }
    return `${r.passed}/${total} passed`;
  };

  console.log(
    `Rule 1 (Scenario → Persona):     ${rule1Status} ${formatCount(rule1Results)}`
  );
  console.log(
    `Rule 2 (Use Case → Scenario):    ${rule2Status} ${formatCount(rule2Results)}`
  );
  console.log(
    `Rule 3 (Feature → Scenario/UC):  ${rule3Status} ${formatCount(rule3Results)}`
  );
  console.log(
    `Rule 4 (CR → Feature):           ${rule4Status} ${formatCount(rule4Results)}`
  );

  // Show exemption summary
  const totalExemptions = exemptionTracker.exemptions.length;
  if (totalExemptions > 0) {
    console.log("-".repeat(60));
    console.log(`Exemptions: ${totalExemptions} files exempted`);
  }
  console.log("=".repeat(60));

  const totalErrors = rule3Results.failed + rule4Results.failed;
  const totalWarnings = rule1Results.failed + rule2Results.failed;

  if (totalErrors > 0) {
    console.log(
      `${RED}❌ Validation failed: ${totalErrors} error${totalErrors > 1 ? "s" : ""}${totalWarnings > 0 ? `, ${totalWarnings} warning${totalWarnings > 1 ? "s" : ""}` : ""}${NC}`
    );
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log(
      `${YELLOW}⚠️  Validation passed with ${totalWarnings} warning${totalWarnings > 1 ? "s" : ""}${NC}`
    );
    process.exit(0);
  } else {
    console.log(`${GREEN}✅ All user value traceability checks passed${NC}`);
    process.exit(0);
  }
}

// Run validation
validateUserValueTraceability();
