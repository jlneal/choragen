#!/usr/bin/env node
/**
 * Validate DesignContract coverage across API routes and CLI handlers
 *
 * Checks:
 * 1. API routes (app/api/.../route.ts) use DesignContract
 * 2. CLI command handlers use DesignContract (future)
 * 3. Reports routes/handlers missing contracts
 *
 * ADR: ADR-002-governance-schema
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const NC = "\x1b[0m";

const projectRoot = process.cwd();

// Paths to check for API routes
const API_DIRS = ["app/api", "src/app/api"];

// Paths to check for CLI handlers
const CLI_DIRS = ["packages/cli/src/commands"];

// Exempt paths (debug, health, dev endpoints)
const EXEMPT_PATHS = ["debug", "dev", "env", "health"];

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

let errors = 0;
let warnings = 0;

/**
 * Check if content uses DesignContract
 */
function hasDesignContract(content) {
  return (
    content.includes("DesignContract") ||
    content.includes("createDesignContract")
  );
}

/**
 * Check if a route is in an exempt path
 */
function isExemptPath(routePath) {
  for (const exemptPath of EXEMPT_PATHS) {
    if (
      routePath.includes(`/${exemptPath}/`) ||
      routePath.includes(`/${exemptPath}`)
    ) {
      return {
        exempt: true,
        reason: `Path contains '${exemptPath}' (exempt category)`,
      };
    }
  }
  return { exempt: false, reason: null };
}

/**
 * Extract HTTP methods exported from a route file
 */
function getExportedMethods(content) {
  const methods = [];
  for (const method of HTTP_METHODS) {
    const patterns = [
      new RegExp(`export\\s+const\\s+${method}\\b`),
      new RegExp(`export\\s+async\\s+function\\s+${method}\\b`),
      new RegExp(`export\\s+function\\s+${method}\\b`),
      new RegExp(`export\\s*\\{[^}]*\\b${method}\\b[^}]*\\}`),
    ];
    if (patterns.some((p) => p.test(content))) {
      methods.push(method);
    }
  }
  return methods;
}

/**
 * Check if route has exemption justification comment
 */
function hasExemptionJustification(content) {
  // Look for @exempt-reason or similar patterns
  const exemptMatch = content.match(/@exempt-reason\s+(.+)/);
  if (exemptMatch) {
    return exemptMatch[1].trim();
  }

  // Look for ADR reference that might justify exemption
  const adrMatch = content.match(/ADR References:[\s\S]*?docs\/adr\/[^\s]+/);
  if (adrMatch) {
    return "Has ADR reference (may justify exemption)";
  }

  return null;
}

/**
 * Recursively find all route.ts files
 */
function findRouteFiles(dir, routes = []) {
  if (!existsSync(dir)) {
    return routes;
  }

  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      findRouteFiles(fullPath, routes);
    } else if (entry === "route.ts" || entry === "route.tsx") {
      const content = readFileSync(fullPath, "utf-8");
      const relativePath = relative(projectRoot, fullPath);
      const { exempt, reason } = isExemptPath(relativePath);
      const methods = getExportedMethods(content);

      // Check for exemption justification if not in exempt path
      let exemptReason = reason;
      if (!exempt) {
        const justification = hasExemptionJustification(content);
        if (justification) {
          exemptReason = justification;
        }
      }

      routes.push({
        path: relativePath,
        hasContract: hasDesignContract(content),
        isExempt: exempt,
        exemptReason,
        methods,
      });
    }
  }

  return routes;
}

/**
 * Find CLI command handlers
 */
function findCliHandlers(dir, handlers = []) {
  if (!existsSync(dir)) {
    return handlers;
  }

  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      findCliHandlers(fullPath, handlers);
    } else if (entry.endsWith(".ts") && !entry.includes(".test.")) {
      const content = readFileSync(fullPath, "utf-8");
      const relativePath = relative(projectRoot, fullPath);

      handlers.push({
        path: relativePath,
        hasContract: hasDesignContract(content),
        isExempt: false,
        exemptReason: null,
        type: "cli-handler",
      });
    }
  }

  return handlers;
}

/**
 * Validate API routes
 */
function validateApiRoutes() {
  console.log("\n📡 Checking API route contract coverage...\n");

  let allRoutes = [];

  for (const apiDir of API_DIRS) {
    const fullDir = join(projectRoot, apiDir);
    if (existsSync(fullDir)) {
      const routes = findRouteFiles(fullDir);
      allRoutes = allRoutes.concat(routes);
    }
  }

  if (allRoutes.length === 0) {
    console.log(`${YELLOW}  No API routes found (this is expected for CLI-only projects)${NC}`);
    return { total: 0, withContracts: 0, exempt: 0, missing: 0 };
  }

  const withContracts = allRoutes.filter((r) => r.hasContract);
  const exempt = allRoutes.filter((r) => r.isExempt && !r.hasContract);
  const withoutContracts = allRoutes.filter(
    (r) => !r.hasContract && !r.isExempt
  );

  // Report routes with contracts
  if (withContracts.length > 0) {
    console.log(`${GREEN}  Routes with DesignContract:${NC}`);
    for (const route of withContracts) {
      console.log(`    ✓ ${route.path} (${route.methods.join(", ")})`);
    }
  }

  // Report exempt routes
  if (exempt.length > 0) {
    console.log(`\n${YELLOW}  Exempt routes:${NC}`);
    for (const route of exempt) {
      console.log(`    ○ ${route.path}: ${route.exemptReason}`);
    }
  }

  // Report routes missing contracts
  if (withoutContracts.length > 0) {
    console.log(`\n${RED}  Routes missing DesignContract:${NC}`);
    for (const route of withoutContracts) {
      console.log(`    ✗ ${route.path} (${route.methods.join(", ")})`);
      errors++;
    }
  }

  return {
    total: allRoutes.length,
    withContracts: withContracts.length,
    exempt: exempt.length,
    missing: withoutContracts.length,
  };
}

/**
 * Validate CLI handlers (informational only for now)
 */
function validateCliHandlers() {
  console.log("\n🖥️  Checking CLI handler contract coverage...\n");

  let allHandlers = [];

  for (const cliDir of CLI_DIRS) {
    const fullDir = join(projectRoot, cliDir);
    if (existsSync(fullDir)) {
      const handlers = findCliHandlers(fullDir);
      allHandlers = allHandlers.concat(handlers);
    }
  }

  if (allHandlers.length === 0) {
    console.log(`${YELLOW}  No CLI command handlers found in expected locations${NC}`);
    console.log(`  (CLI commands may be defined inline in cli.ts)${NC}`);
    return { total: 0, withContracts: 0, missing: 0 };
  }

  const withContracts = allHandlers.filter((h) => h.hasContract);
  const withoutContracts = allHandlers.filter((h) => !h.hasContract);

  if (withContracts.length > 0) {
    console.log(`${GREEN}  Handlers with DesignContract:${NC}`);
    for (const handler of withContracts) {
      console.log(`    ✓ ${handler.path}`);
    }
  }

  if (withoutContracts.length > 0) {
    console.log(`\n${YELLOW}  Handlers without DesignContract (informational):${NC}`);
    for (const handler of withoutContracts) {
      console.log(`    ○ ${handler.path}`);
      warnings++;
    }
  }

  return {
    total: allHandlers.length,
    withContracts: withContracts.length,
    missing: withoutContracts.length,
  };
}

// Run validations
console.log("📋 Validating DesignContract coverage...");

const apiStats = validateApiRoutes();
const cliStats = validateCliHandlers();

// Summary
console.log("\n" + "=".repeat(50));

const totalRoutes = apiStats.total;
const totalWithContracts = apiStats.withContracts;
const totalExempt = apiStats.exempt;
const totalMissing = apiStats.missing;

if (totalRoutes > 0) {
  const nonExempt = totalRoutes - totalExempt;
  const coveragePercent =
    nonExempt > 0 ? Math.round((totalWithContracts / nonExempt) * 100) : 100;

  console.log(`\nAPI Route Coverage: ${coveragePercent}%`);
  console.log(`  Total routes: ${totalRoutes}`);
  console.log(`  With contracts: ${totalWithContracts}`);
  console.log(`  Exempt: ${totalExempt}`);
  console.log(`  Missing: ${totalMissing}`);
}

if (cliStats.total > 0) {
  console.log(`\nCLI Handler Coverage:`);
  console.log(`  Total handlers: ${cliStats.total}`);
  console.log(`  With contracts: ${cliStats.withContracts}`);
  console.log(`  Without contracts: ${cliStats.missing}`);
}

console.log("");

if (errors > 0) {
  console.log(`${RED}❌ ${errors} error(s), ${warnings} warning(s)${NC}`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`${YELLOW}⚠️  ${warnings} warning(s) (informational)${NC}`);
  process.exit(0);
} else {
  console.log(`${GREEN}✅ Contract coverage validated${NC}`);
  process.exit(0);
}
