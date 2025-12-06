// ADR: ADR-001-task-file-format

/**
 * Document creation commands - create CRs, FRs, ADRs, and design documents
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

// Design document types
export const DESIGN_TYPES = [
  "persona",
  "scenario",
  "use-case",
  "feature",
  "enhancement",
] as const;
export type DesignType = (typeof DESIGN_TYPES)[number];

// Template file mapping
const TEMPLATE_MAP: Record<string, string> = {
  cr: "change-request.md",
  fr: "fix-request.md",
  adr: "adr.md",
  feature: "feature.md",
  // Other design types use feature.md as base
  persona: "feature.md",
  scenario: "feature.md",
  "use-case": "feature.md",
  enhancement: "feature.md",
};

// Output directory mapping
const OUTPUT_DIR_MAP: Record<string, string> = {
  cr: "docs/requests/change-requests/todo",
  fr: "docs/requests/fix-requests/todo",
  adr: "docs/adr/todo",
  persona: "docs/design/core/personas",
  scenario: "docs/design/core/scenarios",
  "use-case": "docs/design/core/use-cases",
  feature: "docs/design/core/features",
  enhancement: "docs/design/core/enhancements",
};

export interface CreateDocOptions {
  slug: string;
  title?: string;
  domain?: string;
  severity?: "high" | "medium" | "low";
  linkedRequest?: string;
}

export interface CreateDocResult {
  success: boolean;
  filePath?: string;
  id?: string;
  error?: string;
}

/**
 * Get current date in YYYYMMDD format
 */
function getDateStamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Get current date in YYYY-MM-DD format
 */
function getDateFormatted(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get next sequence number for CR/FR (same day)
 */
async function getNextRequestSeq(
  projectRoot: string,
  type: "cr" | "fr",
  dateStamp: string
): Promise<string> {
  const dirMap = {
    cr: "docs/requests/change-requests",
    fr: "docs/requests/fix-requests",
  };
  const prefix = type.toUpperCase();
  const baseDir = path.join(projectRoot, dirMap[type]);

  // Check all status directories
  const statusDirs = ["todo", "doing", "done"];
  let maxSeq = 0;

  for (const status of statusDirs) {
    const dir = path.join(baseDir, status);
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        // Match pattern: CR-YYYYMMDD-NNN-slug.md or FR-YYYYMMDD-NNN-slug.md
        const match = file.match(
          new RegExp(`^${prefix}-${dateStamp}-(\\d{3})-`)
        );
        if (match) {
          const seq = parseInt(match[1], 10);
          if (seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    } catch {
      // Directory doesn't exist, that's fine
    }
  }

  return String(maxSeq + 1).padStart(3, "0");
}

/**
 * Get next ADR sequence number (global)
 */
async function getNextAdrSeq(projectRoot: string): Promise<string> {
  const baseDir = path.join(projectRoot, "docs/adr");
  const statusDirs = ["todo", "doing", "done", "archive"];
  let maxSeq = 0;

  for (const status of statusDirs) {
    const dir = path.join(baseDir, status);
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        // Handle both files and directories (archive has subdirs)
        if (entry.isDirectory()) {
          const subDir = path.join(dir, entry.name);
          const subFiles = await fs.readdir(subDir);
          for (const file of subFiles) {
            const match = file.match(/^ADR-(\d{3})-/);
            if (match) {
              const seq = parseInt(match[1], 10);
              if (seq > maxSeq) maxSeq = seq;
            }
          }
        } else {
          const match = entry.name.match(/^ADR-(\d{3})-/);
          if (match) {
            const seq = parseInt(match[1], 10);
            if (seq > maxSeq) maxSeq = seq;
          }
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  return String(maxSeq + 1).padStart(3, "0");
}

/**
 * Read and process a template file
 */
async function processTemplate(
  projectRoot: string,
  templateName: string,
  replacements: Record<string, string>
): Promise<string> {
  const templatePath = path.join(projectRoot, "templates", templateName);
  let content = await fs.readFile(templatePath, "utf-8");

  // Replace all {{VARIABLE}} placeholders
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  return content;
}

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Create a Change Request
 */
export async function createCR(
  projectRoot: string,
  options: CreateDocOptions
): Promise<CreateDocResult> {
  try {
    const dateStamp = getDateStamp();
    const dateFormatted = getDateFormatted();
    const seq = await getNextRequestSeq(projectRoot, "cr", dateStamp);
    const id = `CR-${dateStamp}-${seq}`;
    const title = options.title || options.slug;

    const replacements: Record<string, string> = {
      TITLE: title,
      DATE: dateStamp,
      DATE_FORMATTED: dateFormatted,
      SEQ: seq,
      DOMAIN: options.domain || "core",
      OWNER: "agent",
      DESCRIPTION: "[Describe what this change does]",
      MOTIVATION: "[Explain why this change is needed]",
      IN_SCOPE_1: "[First item in scope]",
      IN_SCOPE_2: "[Second item in scope]",
      OUT_OF_SCOPE_1: "[First item out of scope]",
      DESIGN_DOC_1: "[Link to design document]",
      ADR_1: "[Link to ADR]",
      NOTES: "[Implementation notes]",
    };

    const content = await processTemplate(
      projectRoot,
      TEMPLATE_MAP.cr,
      replacements
    );
    const outputDir = path.join(projectRoot, OUTPUT_DIR_MAP.cr);
    await ensureDir(outputDir);

    const fileName = `${id}-${options.slug}.md`;
    const filePath = path.join(outputDir, fileName);

    await fs.writeFile(filePath, content, "utf-8");

    return {
      success: true,
      filePath: path.relative(projectRoot, filePath),
      id,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Close a Change Request (move to done)
 */
export async function closeCR(
  projectRoot: string,
  crId: string
): Promise<CreateDocResult> {
  try {
    const baseDir = path.join(projectRoot, "docs/requests/change-requests");
    const statusDirs = ["todo", "doing"];

    let sourcePath: string | null = null;
    let fileName: string | null = null;

    // Find the CR file
    for (const status of statusDirs) {
      const dir = path.join(baseDir, status);
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (file.startsWith(crId)) {
            sourcePath = path.join(dir, file);
            fileName = file;
            break;
          }
        }
      } catch {
        // Directory doesn't exist
      }
      if (sourcePath) break;
    }

    if (!sourcePath || !fileName) {
      return {
        success: false,
        error: `CR not found: ${crId}`,
      };
    }

    // Read content and add completion date
    let content = await fs.readFile(sourcePath, "utf-8");
    const dateFormatted = getDateFormatted();

    // Update status
    content = content.replace(
      /\*\*Status\*\*:\s*\w+/,
      "**Status**: done"
    );

    // Add completion date if not present
    if (!content.includes("**Completed**:")) {
      content = content.replace(
        /(\*\*Created\*\*:[^\n]+)/,
        `$1\n**Completed**: ${dateFormatted}`
      );
    }

    // Move to done directory
    const doneDir = path.join(baseDir, "done");
    await ensureDir(doneDir);
    const destPath = path.join(doneDir, fileName);

    await fs.writeFile(destPath, content, "utf-8");
    await fs.unlink(sourcePath);

    return {
      success: true,
      filePath: path.relative(projectRoot, destPath),
      id: crId,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Create a Fix Request
 */
export async function createFR(
  projectRoot: string,
  options: CreateDocOptions
): Promise<CreateDocResult> {
  try {
    const dateStamp = getDateStamp();
    const dateFormatted = getDateFormatted();
    const seq = await getNextRequestSeq(projectRoot, "fr", dateStamp);
    const id = `FR-${dateStamp}-${seq}`;
    const title = options.title || options.slug;

    const replacements: Record<string, string> = {
      TITLE: title,
      DATE: dateStamp,
      DATE_FORMATTED: dateFormatted,
      SEQ: seq,
      DOMAIN: options.domain || "core",
      OWNER: "agent",
      SEVERITY: options.severity || "medium",
      PROBLEM_DESCRIPTION: "[Describe the problem]",
      EXPECTED: "[What should happen]",
      ACTUAL: "[What actually happens]",
      STEP_1: "[First step to reproduce]",
      STEP_2: "[Second step]",
      STEP_3: "[Third step]",
      ROOT_CAUSE: "[Analysis of root cause]",
      PROPOSED_FIX: "[Proposed solution]",
      FILE_1: "[Affected file]",
      ADR_1: "[Link to ADR]",
    };

    const content = await processTemplate(
      projectRoot,
      TEMPLATE_MAP.fr,
      replacements
    );
    const outputDir = path.join(projectRoot, OUTPUT_DIR_MAP.fr);
    await ensureDir(outputDir);

    const fileName = `${id}-${options.slug}.md`;
    const filePath = path.join(outputDir, fileName);

    await fs.writeFile(filePath, content, "utf-8");

    return {
      success: true,
      filePath: path.relative(projectRoot, filePath),
      id,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Create an Architecture Decision Record
 */
export async function createADR(
  projectRoot: string,
  options: CreateDocOptions
): Promise<CreateDocResult> {
  try {
    const dateFormatted = getDateFormatted();
    const seq = await getNextAdrSeq(projectRoot);
    const id = `ADR-${seq}`;
    const title = options.title || options.slug;

    const replacements: Record<string, string> = {
      TITLE: title,
      DATE: dateFormatted,
      SEQ: seq,
      CR_FR_ID: options.linkedRequest || "[CR/FR ID]",
      DESIGN_DOC: "[Link to design document]",
      CONTEXT: "[Describe the context and problem]",
      DECISION: "[State the decision]",
      POSITIVE_1: "[First positive consequence]",
      POSITIVE_2: "[Second positive consequence]",
      NEGATIVE_1: "[First negative consequence]",
      MITIGATION_1: "[How to mitigate the negative]",
      ALT_1_NAME: "[Alternative name]",
      ALT_1_DESCRIPTION: "[Alternative description]",
      ALT_1_REJECTION: "[Why rejected]",
      IMPL_FILE_1: "[Implementation file]",
      IMPL_FILE_2: "[Implementation file]",
    };

    const content = await processTemplate(
      projectRoot,
      TEMPLATE_MAP.adr,
      replacements
    );
    const outputDir = path.join(projectRoot, OUTPUT_DIR_MAP.adr);
    await ensureDir(outputDir);

    const fileName = `${id}-${options.slug}.md`;
    const filePath = path.join(outputDir, fileName);

    await fs.writeFile(filePath, content, "utf-8");

    return {
      success: true,
      filePath: path.relative(projectRoot, filePath),
      id,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Archive an ADR (move to archive/YYYY-MM/)
 */
export async function archiveADR(
  projectRoot: string,
  adrFile: string
): Promise<CreateDocResult> {
  try {
    const baseDir = path.join(projectRoot, "docs/adr");
    const statusDirs = ["todo", "doing", "done"];

    let sourcePath: string | null = null;
    let fileName: string | null = null;

    // Find the ADR file
    for (const status of statusDirs) {
      const dir = path.join(baseDir, status);
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (file === adrFile || file.startsWith(adrFile)) {
            sourcePath = path.join(dir, file);
            fileName = file;
            break;
          }
        }
      } catch {
        // Directory doesn't exist
      }
      if (sourcePath) break;
    }

    if (!sourcePath || !fileName) {
      return {
        success: false,
        error: `ADR not found: ${adrFile}`,
      };
    }

    // Get archive directory (YYYY-MM)
    const now = new Date();
    const archiveSubdir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const archiveDir = path.join(baseDir, "archive", archiveSubdir);
    await ensureDir(archiveDir);

    // Read content and update status
    let content = await fs.readFile(sourcePath, "utf-8");
    content = content.replace(
      /\*\*Status\*\*:\s*\w+/,
      "**Status**: archived"
    );

    // Add archived date if not present
    const dateFormatted = getDateFormatted();
    if (!content.includes("**Archived**:")) {
      content = content.replace(
        /(\*\*Created\*\*:[^\n]+)/,
        `$1\n**Archived**: ${dateFormatted}`
      );
    }

    const destPath = path.join(archiveDir, fileName);
    await fs.writeFile(destPath, content, "utf-8");
    await fs.unlink(sourcePath);

    // Extract ADR ID from filename
    const idMatch = fileName.match(/^(ADR-\d{3})/);
    const id = idMatch ? idMatch[1] : fileName;

    return {
      success: true,
      filePath: path.relative(projectRoot, destPath),
      id,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Create a design document
 */
export async function createDesignDoc(
  projectRoot: string,
  type: DesignType,
  options: CreateDocOptions
): Promise<CreateDocResult> {
  try {
    const dateFormatted = getDateFormatted();
    const title = options.title || options.slug;

    // Capitalize type for display
    const typeDisplay = type.charAt(0).toUpperCase() + type.slice(1);

    const replacements: Record<string, string> = {
      TITLE: title,
      DATE: dateFormatted,
      DOMAIN: options.domain || "core",
      STATUS: "draft",
      OVERVIEW: `[Overview of this ${type}]`,
      CAPABILITIES: `[Capabilities of this ${type}]`,
      PERSONA: "[Target persona]",
      ACTION: "[What they want to do]",
      BENEFIT: "[Why they want to do it]",
      CRITERION_1: "[First acceptance criterion]",
      CRITERION_2: "[Second acceptance criterion]",
      CRITERION_3: "[Third acceptance criterion]",
      ADR_1: "[Link to ADR]",
      SCENARIO_1: "[Link to scenario]",
      IMPL_FILE_1: "[Implementation file]",
      TEST_FILE_1: "[Test file]",
    };

    const templateName = TEMPLATE_MAP[type] || TEMPLATE_MAP.feature;
    let content = await processTemplate(projectRoot, templateName, replacements);

    // Adjust header based on type
    content = content.replace(/^# Feature:/, `# ${typeDisplay}:`);

    const outputDir = path.join(projectRoot, OUTPUT_DIR_MAP[type]);
    await ensureDir(outputDir);

    const fileName = `${options.slug}.md`;
    const filePath = path.join(outputDir, fileName);

    await fs.writeFile(filePath, content, "utf-8");

    return {
      success: true,
      filePath: path.relative(projectRoot, filePath),
      id: options.slug,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Format the result of a document creation for console output
 */
export function formatCreateResult(result: CreateDocResult, docType: string): string {
  if (!result.success) {
    return `❌ Failed to create ${docType}: ${result.error}`;
  }

  const lines = [
    `✓ Created ${docType}: ${result.id}`,
    `  File: ${result.filePath}`,
    "",
    "Next steps:",
    "  1. Edit the file to fill in the details",
    "  2. Replace placeholder text with actual content",
  ];

  return lines.join("\n");
}
