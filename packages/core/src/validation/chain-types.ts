/**
 * Chain type validation
 *
 * Validates that requests have required chain types (design + implementation)
 * and enforces the design-before-implementation rule.
 *
 * ADR: ADR-001-task-file-format
 */

import type { Chain, TaskStatus } from "../tasks/types.js";
import { ChainManager } from "../tasks/chain-manager.js";

/** Validation error severity */
export type ValidationSeverity = "error" | "warning";

/** Single validation issue */
export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  chainId?: string;
}

/** Result of validating a request's chains */
export interface RequestValidationResult {
  requestId: string;
  valid: boolean;
  issues: ValidationIssue[];
  chains: {
    design: Chain[];
    implementation: Chain[];
    other: Chain[];
  };
}

/** Options for request validation */
export interface ValidateRequestOptions {
  /** If true, skip design chain requirement (for hotfixes) */
  skipDesign?: boolean;
  /** Justification for skipping design (required if skipDesign is true) */
  skipDesignReason?: string;
}

/**
 * Get the derived status of a chain based on its tasks
 */
function getChainStatus(chain: Chain): TaskStatus {
  if (chain.tasks.length === 0) return "backlog";

  const statuses = chain.tasks.map((t) => t.status);

  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("in-progress")) return "in-progress";
  if (statuses.includes("in-review")) return "in-review";
  if (statuses.every((s) => s === "done")) return "done";
  if (statuses.includes("todo")) return "todo";

  return "backlog";
}

/**
 * Check if a chain is complete (all tasks done)
 */
function isChainComplete(chain: Chain): boolean {
  return getChainStatus(chain) === "done";
}

/**
 * Validate that a request has the required chain types
 */
export async function validateRequestChains(
  projectRoot: string,
  requestId: string,
  options: ValidateRequestOptions = {}
): Promise<RequestValidationResult> {
  const chainManager = new ChainManager(projectRoot);
  const allChains = await chainManager.getAllChains();

  // Filter chains for this request
  const requestChains = allChains.filter((c) => c.requestId === requestId);

  // Categorize chains by type
  const designChains = requestChains.filter((c) => c.type === "design");
  const implChains = requestChains.filter((c) => c.type === "implementation");
  const otherChains = requestChains.filter(
    (c) => c.type !== "design" && c.type !== "implementation"
  );

  const issues: ValidationIssue[] = [];

  // Check for missing design chain (unless skipped)
  if (!options.skipDesign && designChains.length === 0) {
    issues.push({
      severity: "error",
      code: "MISSING_DESIGN_CHAIN",
      message: `Request ${requestId} has no design chain`,
    });
  }

  // Check for skip-design without justification
  if (options.skipDesign && !options.skipDesignReason) {
    issues.push({
      severity: "error",
      code: "SKIP_DESIGN_NO_REASON",
      message: `Request ${requestId} skips design chain but no justification provided`,
    });
  }

  // Check for missing implementation chain
  if (implChains.length === 0) {
    issues.push({
      severity: "error",
      code: "MISSING_IMPL_CHAIN",
      message: `Request ${requestId} has no implementation chain`,
    });
  }

  // Check that impl chains are blocked until design is done
  if (!options.skipDesign && designChains.length > 0 && implChains.length > 0) {
    const designComplete = designChains.every(isChainComplete);

    if (!designComplete) {
      for (const implChain of implChains) {
        const implStatus = getChainStatus(implChain);

        // If impl chain has started but design isn't done, that's an error
        if (
          implStatus === "in-progress" ||
          implStatus === "in-review" ||
          implStatus === "done"
        ) {
          issues.push({
            severity: "error",
            code: "IMPL_BEFORE_DESIGN",
            message: `Implementation chain ${implChain.id} has started but design chain(s) not complete`,
            chainId: implChain.id,
          });
        }
      }
    }
  }

  // Check impl chains have dependsOn pointing to design chain
  for (const implChain of implChains) {
    if (!options.skipDesign && designChains.length > 0 && !implChain.dependsOn) {
      issues.push({
        severity: "warning",
        code: "IMPL_NO_DEPENDS_ON",
        message: `Implementation chain ${implChain.id} should have dependsOn pointing to design chain`,
        chainId: implChain.id,
      });
    }

    // If dependsOn is set, verify it points to a valid design chain
    if (implChain.dependsOn) {
      const dependsOnChain = allChains.find((c) => c.id === implChain.dependsOn);
      if (!dependsOnChain) {
        issues.push({
          severity: "error",
          code: "INVALID_DEPENDS_ON",
          message: `Implementation chain ${implChain.id} depends on non-existent chain ${implChain.dependsOn}`,
          chainId: implChain.id,
        });
      } else if (dependsOnChain.type !== "design") {
        issues.push({
          severity: "warning",
          code: "DEPENDS_ON_NOT_DESIGN",
          message: `Implementation chain ${implChain.id} depends on ${implChain.dependsOn} which is not a design chain`,
          chainId: implChain.id,
        });
      }
    }
  }

  // Warn about untyped chains
  for (const chain of otherChains) {
    issues.push({
      severity: "warning",
      code: "UNTYPED_CHAIN",
      message: `Chain ${chain.id} has no type (should be 'design' or 'implementation')`,
      chainId: chain.id,
    });
  }

  const hasErrors = issues.some((i) => i.severity === "error");

  return {
    requestId,
    valid: !hasErrors,
    issues,
    chains: {
      design: designChains,
      implementation: implChains,
      other: otherChains,
    },
  };
}

/**
 * Validate all requests in the project
 */
export async function validateAllRequests(
  projectRoot: string
): Promise<RequestValidationResult[]> {
  const chainManager = new ChainManager(projectRoot);
  const allChains = await chainManager.getAllChains();

  // Get unique request IDs
  const requestIds = [...new Set(allChains.map((c) => c.requestId).filter(Boolean))];

  const results: RequestValidationResult[] = [];

  for (const requestId of requestIds) {
    const result = await validateRequestChains(projectRoot, requestId);
    results.push(result);
  }

  return results;
}

/**
 * Format validation result for console output
 */
export function formatValidationResult(result: RequestValidationResult): string {
  const lines: string[] = [];

  lines.push(`Request: ${result.requestId}`);
  lines.push(`  Design chains: ${result.chains.design.length}`);
  lines.push(`  Implementation chains: ${result.chains.implementation.length}`);

  if (result.chains.other.length > 0) {
    lines.push(`  Untyped chains: ${result.chains.other.length}`);
  }

  if (result.issues.length === 0) {
    lines.push("  ✓ Valid");
  } else {
    for (const issue of result.issues) {
      const prefix = issue.severity === "error" ? "✗" : "⚠";
      lines.push(`  ${prefix} [${issue.code}] ${issue.message}`);
    }
  }

  return lines.join("\n");
}
