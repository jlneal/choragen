/**
 * Task file parsing and serialization
 *
 * Tasks are stored as markdown files with YAML frontmatter.
 */

import type { Task, TaskStatus } from "./types.js";

/** Regex patterns for parsing */
const TASK_ID_PATTERN = /^(\d{3})-(.+)$/;
const CHAIN_ID_PATTERN = /^CHAIN-(\d{3})-(.+)$/;

/**
 * Parse a task ID into its components
 * @example parseTaskId("001-setup-api") => { sequence: 1, slug: "setup-api" }
 */
export function parseTaskId(taskId: string): {
  sequence: number;
  slug: string;
} | null {
  const match = taskId.match(TASK_ID_PATTERN);
  if (!match) return null;
  return {
    sequence: parseInt(match[1], 10),
    slug: match[2],
  };
}

/**
 * Parse a chain ID into its components
 * @example parseChainId("CHAIN-001-profile") => { sequence: 1, slug: "profile" }
 */
export function parseChainId(chainId: string): {
  sequence: number;
  slug: string;
} | null {
  const match = chainId.match(CHAIN_ID_PATTERN);
  if (!match) return null;
  return {
    sequence: parseInt(match[1], 10),
    slug: match[2],
  };
}

/**
 * Format a sequence number with zero-padding
 * @example formatSequence(1) => "001"
 */
export function formatSequence(seq: number): string {
  return seq.toString().padStart(3, "0");
}

/**
 * Generate a task ID from components
 * @example formatTaskId(1, "setup-api") => "001-setup-api"
 */
export function formatTaskId(sequence: number, slug: string): string {
  return `${formatSequence(sequence)}-${slug}`;
}

/**
 * Generate a chain ID from components
 * @example formatChainId(1, "profile") => "CHAIN-001-profile"
 */
export function formatChainId(sequence: number, slug: string): string {
  return `CHAIN-${formatSequence(sequence)}-${slug}`;
}

/**
 * Parse task markdown content into a Task object
 */
export function parseTaskMarkdown(
  content: string,
  chainId: string,
  status: TaskStatus
): Task | null {
  const lines = content.split("\n");

  // Extract title from first heading
  const titleLine = lines.find((l) => l.startsWith("# Task:"));
  if (!titleLine) return null;
  const title = titleLine.replace("# Task:", "").trim();

  // Parse metadata section (between title and first ---)
  const metadata: Record<string, string> = {};
  let metadataEnd = 0;
  let foundTitle = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip until we find the title
    if (!foundTitle) {
      if (line.startsWith("# Task:")) {
        foundTitle = true;
      }
      continue;
    }
    
    // Stop at first ---
    if (line === "---") {
      metadataEnd = i;
      break;
    }
    
    // Parse metadata lines (format: **Key**: value or Key: value)
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      let key = line.slice(0, colonIdx).replace(/\*\*/g, "").trim();
      let value = line.slice(colonIdx + 1).replace(/\*\*/g, "").trim();
      // Remove trailing markdown (like "  " for line breaks)
      value = value.replace(/\s+$/, "");
      metadata[key.toLowerCase()] = value;
    }
  }

  // Parse task ID from metadata
  const taskIdStr = metadata["task"];
  if (!taskIdStr) return null;
  const taskIdParts = parseTaskId(taskIdStr);
  if (!taskIdParts) return null;

  // Extract sections
  const sections = extractSections(lines.slice(metadataEnd + 1));

  return {
    id: taskIdStr,
    sequence: taskIdParts.sequence,
    slug: taskIdParts.slug,
    status,
    chainId,
    title,
    description: sections["objective"] || "",
    expectedFiles: parseList(sections["expected files"] || ""),
    acceptance: parseList(sections["acceptance criteria"] || ""),
    constraints: parseList(sections["constraints"] || ""),
    notes: sections["notes"] || "",
    createdAt: parseDate(metadata["created"]) || new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Serialize a Task object to markdown
 */
export function serializeTaskMarkdown(task: Task): string {
  const lines: string[] = [];

  // Title
  lines.push(`# Task: ${task.title}`);
  lines.push("");

  // Metadata
  lines.push(`**Chain**: ${task.chainId}  `);
  lines.push(`**Task**: ${task.id}  `);
  lines.push(`**Status**: ${task.status}  `);
  lines.push(`**Created**: ${formatDate(task.createdAt)}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Objective
  lines.push("## Objective");
  lines.push("");
  lines.push(task.description);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Expected Files
  lines.push("## Expected Files");
  lines.push("");
  for (const file of task.expectedFiles) {
    lines.push(`- \`${file}\``);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  // Acceptance Criteria
  lines.push("## Acceptance Criteria");
  lines.push("");
  for (const criterion of task.acceptance) {
    lines.push(`- [ ] ${criterion}`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  // Constraints
  if (task.constraints.length > 0) {
    lines.push("## Constraints");
    lines.push("");
    for (const constraint of task.constraints) {
      lines.push(`- ${constraint}`);
    }
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // Notes
  lines.push("## Notes");
  lines.push("");
  lines.push(task.notes || "_No notes yet._");
  lines.push("");

  return lines.join("\n");
}

// Helper functions

function extractSections(lines: string[]): Record<string, string> {
  const sections: Record<string, string> = {};
  let currentSection = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentSection) {
        sections[currentSection.toLowerCase()] = currentContent
          .join("\n")
          .trim();
      }
      currentSection = line.slice(3).trim();
      currentContent = [];
    } else if (line === "---") {
      if (currentSection) {
        sections[currentSection.toLowerCase()] = currentContent
          .join("\n")
          .trim();
        currentSection = "";
        currentContent = [];
      }
    } else {
      currentContent.push(line);
    }
  }

  if (currentSection) {
    sections[currentSection.toLowerCase()] = currentContent.join("\n").trim();
  }

  return sections;
}

function parseList(content: string): string[] {
  return content
    .split("\n")
    .map((line) => {
      // Remove list markers and checkbox markers
      return line
        .replace(/^[-*]\s*/, "")
        .replace(/^\[[ x]\]\s*/, "")
        .replace(/`/g, "")
        .trim();
    })
    .filter((line) => line.length > 0);
}

function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
