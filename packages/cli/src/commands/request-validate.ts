// ADR: ADR-003-cli-structure

/**
 * Request validation helpers - verify completeness before closure
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { ChainManager } from "@choragen/core";

export interface RequestValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  requestPath?: string;
}

const REQUEST_TYPES = [
  { dir: "docs/requests/change-requests" },
  { dir: "docs/requests/fix-requests" },
] as const;

const REQUEST_STATUSES = ["todo", "doing"] as const;

async function findRequestFile(projectRoot: string, requestId: string): Promise<string | null> {
  for (const { dir } of REQUEST_TYPES) {
    for (const status of REQUEST_STATUSES) {
      const searchDir = path.join(projectRoot, dir, status);
      try {
        const files = await fs.readdir(searchDir);
        for (const file of files) {
          if (file.startsWith(requestId) && file.endsWith(".md")) {
            return path.join(searchDir, file);
          }
        }
      } catch {
        // Directory missing, continue
      }
    }
  }

  return null;
}

function extractSection(content: string, sectionName: string): string | null {
  const pattern = new RegExp(
    String.raw`## ${sectionName}[ \t]*\n([\s\S]*?)(?=\n## |\n---|$)`,
    "i"
  );
  const match = content.match(pattern);
  return match ? match[1].trim() : null;
}

function isCompletionNotesFilled(content: string): boolean {
  const completionNotes = extractSection(content, "Completion Notes");
  if (!completionNotes) {
    return false;
  }

  const UNFILLED_MARKER = "TO" + "DO";
  const placeholderPatterns = [
    /^\[.*\]$/m,
    new RegExp(`^${UNFILLED_MARKER}$`, "im"),
    /^TBD$/im,
    /^None$/im,
    /^N\/A$/im,
  ];

  const trimmed = completionNotes.trim();
  if (!trimmed) {
    return false;
  }

  return !placeholderPatterns.some((pattern) => pattern.test(trimmed));
}

function countUncheckedCriteria(content: string): number {
  const acceptanceCriteria = extractSection(content, "Acceptance Criteria");
  if (!acceptanceCriteria) {
    return 0;
  }

  const uncheckedPattern = /^[\s]*[-*]\s*\[\s*\]/gm;
  const matches = acceptanceCriteria.match(uncheckedPattern);
  return matches ? matches.length : 0;
}

function isPlaceholderValue(value: string): boolean {
  const normalized = value.trim();
  const placeholderPatterns = [
    /^\[.*\]$/i,
    /^No commits yet\.?$/i,
    /^No commits$/i,
    /^Added during implementation\.?$/i,
    /^Created during implementation\.?$/i,
    /^TBD$/i,
    /^TO\s*DO$/i,
    /^None$/i,
    /^N\/A$/i,
  ];

  return placeholderPatterns.some((pattern) => pattern.test(normalized));
}

function hasCommitsSectionFilled(content: string): boolean {
  const commits = extractSection(content, "Commits");
  if (!commits) {
    return false;
  }

  const trimmed = commits.trim();
  if (!trimmed) {
    return false;
  }

  const lines = trimmed
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return false;
  }

  const meaningfulLines = lines.filter((line) => !isPlaceholderValue(line));
  return meaningfulLines.length > 0;
}

function findTodoAdrLinks(content: string): string[] {
  const linkedAdrs = extractSection(content, "Linked ADRs");
  if (!linkedAdrs) {
    return [];
  }

  const todoPattern = /(^|\/)adr\/todo(\/|$)/;
  const links: string[] = [];

  const matches = linkedAdrs.matchAll(/\[[^\]]+\]\(([^)]+)\)/g);
  for (const match of matches) {
    const target = match[1];
    const normalized = target.replace(/\\/g, "/").toLowerCase();
    if (todoPattern.test(normalized)) {
      links.push(target);
    }
  }

  return links;
}

async function validateChainsApproved(projectRoot: string, requestId: string): Promise<string[]> {
  const chainManager = new ChainManager(projectRoot);
  const chains = (await chainManager.getAllChains()).filter(
    (chain) => chain.requestId === requestId
  );

  if (chains.length === 0) {
    return [`No chains found for request: ${requestId}`];
  }

  const notApproved = chains.filter((chain) => chain.reviewStatus !== "approved");
  if (notApproved.length === 0) {
    return [];
  }

  const details = notApproved
    .map((chain) => `${chain.id} [${chain.reviewStatus ?? "unreviewed"}]`)
    .join(", ");

  return [`All chains must be approved before closure. Pending: ${details}`];
}

export async function validateRequestForClosure(
  projectRoot: string,
  requestId: string
): Promise<RequestValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const requestPath = await findRequestFile(projectRoot, requestId);
  if (!requestPath) {
    return {
      valid: false,
      errors: [`Request not found in todo/ or doing/: ${requestId}`],
    };
  }

  try {
    const content = await fs.readFile(requestPath, "utf-8");

    if (!hasCommitsSectionFilled(content)) {
      errors.push("Commits section is missing or not populated with real entries");
    }

    if (!isCompletionNotesFilled(content)) {
      errors.push("Completion Notes section is missing or contains placeholder text");
    }

    const uncheckedCriteria = countUncheckedCriteria(content);
    if (uncheckedCriteria > 0) {
      errors.push(`${uncheckedCriteria} acceptance criteria unchecked`);
    }

    const todoAdrs = findTodoAdrLinks(content);
    if (todoAdrs.length > 0) {
      errors.push(`Linked ADRs must be in done/ or doing/: ${todoAdrs.join(", ")}`);
    }

    const chainErrors = await validateChainsApproved(projectRoot, requestId);
    errors.push(...chainErrors);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      requestPath,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error during validation";
    return {
      valid: false,
      errors: [`Failed to validate request ${requestId}: ${message}`],
      warnings,
      requestPath,
    };
  }
}
