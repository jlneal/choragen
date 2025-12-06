#!/usr/bin/env node
/**
 * Validate chain types for all requests
 *
 * Checks:
 * 1. Requests have both design and implementation chains
 * 2. Implementation chains are blocked until design chains complete
 * 3. Implementation chains have dependsOn pointing to design chain
 * 4. Chains have explicit type (design or implementation)
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
 * Load chain metadata from .chains directory
 */
function loadChains() {
  const chainsDir = join(projectRoot, "docs/tasks/.chains");
  if (!existsSync(chainsDir)) {
    return [];
  }

  const files = readdirSync(chainsDir).filter((f) => f.endsWith(".json"));
  const chains = [];

  for (const file of files) {
    try {
      const content = readFileSync(join(chainsDir, file), "utf-8");
      const chain = JSON.parse(content);
      chains.push(chain);
    } catch (e) {
      console.log(`${YELLOW}  [WARN] Could not parse ${file}: ${e.message}${NC}`);
      warnings++;
    }
  }

  return chains;
}

/**
 * Get chain status from task files
 */
function getChainStatus(chainId) {
  const statusDirs = ["backlog", "todo", "in-progress", "in-review", "done", "blocked"];
  const tasksPath = join(projectRoot, "docs/tasks");

  for (const status of statusDirs) {
    const chainDir = join(tasksPath, status, chainId);
    if (existsSync(chainDir)) {
      const tasks = readdirSync(chainDir).filter((f) => f.endsWith(".md"));
      if (tasks.length > 0) {
        // If any tasks exist in this status dir, that's the chain's effective status
        // (simplified - real implementation would check all tasks)
        return status;
      }
    }
  }

  // Check if all tasks are done
  const doneDir = join(tasksPath, "done", chainId);
  if (existsSync(doneDir)) {
    return "done";
  }

  return "backlog";
}

/**
 * Check if a chain is complete
 */
function isChainComplete(chainId) {
  return getChainStatus(chainId) === "done";
}

/**
 * Validate chains for a single request
 */
function validateRequest(requestId, chains) {
  const requestChains = chains.filter((c) => c.requestId === requestId);
  const issues = [];

  // Categorize by type
  const designChains = requestChains.filter((c) => c.type === "design");
  const implChains = requestChains.filter((c) => c.type === "implementation");
  const untypedChains = requestChains.filter(
    (c) => c.type !== "design" && c.type !== "implementation"
  );

  // Check for missing design chain
  if (designChains.length === 0) {
    // Check if any impl chain has skipDesign flag
    const hasSkipDesign = implChains.some((c) => c.skipDesign);
    if (!hasSkipDesign) {
      issues.push({
        severity: "error",
        code: "MISSING_DESIGN_CHAIN",
        message: `Request ${requestId} has no design chain`,
      });
    }
  }

  // Check for missing implementation chain
  if (implChains.length === 0) {
    issues.push({
      severity: "error",
      code: "MISSING_IMPL_CHAIN",
      message: `Request ${requestId} has no implementation chain`,
    });
  }

  // Check impl chains are blocked until design complete
  if (designChains.length > 0 && implChains.length > 0) {
    const designComplete = designChains.every((c) => isChainComplete(c.chainId || c.id));

    if (!designComplete) {
      for (const implChain of implChains) {
        const implStatus = getChainStatus(implChain.chainId || implChain.id);
        if (implStatus === "in-progress" || implStatus === "in-review" || implStatus === "done") {
          issues.push({
            severity: "error",
            code: "IMPL_BEFORE_DESIGN",
            message: `Implementation chain ${implChain.chainId || implChain.id} started but design not complete`,
          });
        }
      }
    }
  }

  // Check impl chains have dependsOn
  for (const implChain of implChains) {
    if (designChains.length > 0 && !implChain.dependsOn) {
      issues.push({
        severity: "warning",
        code: "IMPL_NO_DEPENDS_ON",
        message: `Implementation chain ${implChain.chainId || implChain.id} should have dependsOn`,
      });
    }
  }

  // Warn about untyped chains
  for (const chain of untypedChains) {
    issues.push({
      severity: "warning",
      code: "UNTYPED_CHAIN",
      message: `Chain ${chain.chainId || chain.id} has no type`,
    });
  }

  return {
    requestId,
    valid: !issues.some((i) => i.severity === "error"),
    issues,
    chains: {
      design: designChains,
      implementation: implChains,
      untyped: untypedChains,
    },
  };
}

// Run validation
console.log("🔗 Validating chain types...\n");

const chains = loadChains();

if (chains.length === 0) {
  console.log(`${YELLOW}  No chains found in docs/tasks/.chains/${NC}`);
  process.exit(0);
}

// Get unique request IDs
const requestIds = [...new Set(chains.map((c) => c.requestId).filter(Boolean))];

console.log(`Found ${chains.length} chains for ${requestIds.length} requests\n`);

for (const requestId of requestIds) {
  const result = validateRequest(requestId, chains);

  console.log(`📋 ${requestId}`);
  console.log(`   Design chains: ${result.chains.design.length}`);
  console.log(`   Implementation chains: ${result.chains.implementation.length}`);

  if (result.chains.untyped.length > 0) {
    console.log(`   Untyped chains: ${result.chains.untyped.length}`);
  }

  if (result.issues.length === 0) {
    console.log(`   ${GREEN}✓ Valid${NC}`);
  } else {
    for (const issue of result.issues) {
      if (issue.severity === "error") {
        console.log(`   ${RED}✗ [${issue.code}] ${issue.message}${NC}`);
        errors++;
      } else {
        console.log(`   ${YELLOW}⚠ [${issue.code}] ${issue.message}${NC}`);
        warnings++;
      }
    }
  }
  console.log("");
}

// Summary
console.log("=".repeat(50));
if (errors > 0) {
  console.log(`${RED}❌ ${errors} error(s), ${warnings} warning(s)${NC}`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`${YELLOW}⚠️  ${warnings} warning(s)${NC}`);
  process.exit(0);
} else {
  console.log(`${GREEN}✅ All chain types validated${NC}`);
  process.exit(0);
}
