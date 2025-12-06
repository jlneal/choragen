// ADR: ADR-001-task-file-format

/**
 * Request commands - validate request chain coverage
 */

import {
  validateRequestChains,
  validateAllRequests,
  formatValidationResult,
  type RequestValidationResult,
} from "@choragen/core";

export interface ValidateOptions {
  /** If true, skip design chain requirement */
  skipDesign?: boolean;
  /** Justification for skipping design */
  skipDesignReason?: string;
  /** Output format: 'text' or 'json' */
  format?: "text" | "json";
}

export interface ValidateResult {
  success: boolean;
  results: RequestValidationResult[];
  errorCount: number;
  warningCount: number;
}

/**
 * Validate a single request's chain coverage
 */
export async function validateRequest(
  projectRoot: string,
  requestId: string,
  options: ValidateOptions = {}
): Promise<ValidateResult> {
  const result = await validateRequestChains(projectRoot, requestId, {
    skipDesign: options.skipDesign,
    skipDesignReason: options.skipDesignReason,
  });

  const errorCount = result.issues.filter(
    (i: { severity: string }) => i.severity === "error"
  ).length;
  const warningCount = result.issues.filter(
    (i: { severity: string }) => i.severity === "warning"
  ).length;

  return {
    success: result.valid,
    results: [result],
    errorCount,
    warningCount,
  };
}

/**
 * Validate all requests in the project
 */
export async function validateRequests(
  projectRoot: string,
  _options: ValidateOptions = {}
): Promise<ValidateResult> {
  const results = await validateAllRequests(projectRoot);

  let errorCount = 0;
  let warningCount = 0;

  for (const result of results) {
    errorCount += result.issues.filter(
      (i: { severity: string }) => i.severity === "error"
    ).length;
    warningCount += result.issues.filter(
      (i: { severity: string }) => i.severity === "warning"
    ).length;
  }

  const success = results.every((r: { valid: boolean }) => r.valid);

  return {
    success,
    results,
    errorCount,
    warningCount,
  };
}

/**
 * Format validation results for console output
 */
export function formatValidateResult(result: ValidateResult): string {
  const lines: string[] = [];

  for (const r of result.results) {
    lines.push(formatValidationResult(r));
    lines.push("");
  }

  lines.push("=".repeat(50));

  if (result.errorCount > 0) {
    lines.push(`❌ ${result.errorCount} error(s), ${result.warningCount} warning(s)`);
  } else if (result.warningCount > 0) {
    lines.push(`⚠️  ${result.warningCount} warning(s)`);
  } else {
    lines.push("✅ All requests validated");
  }

  return lines.join("\n");
}
