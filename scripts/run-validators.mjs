#!/usr/bin/env node
/**
 * Run all validation scripts
 *
 * Executes all validators in sequence and reports results.
 * Exits with code 1 if any validator fails.
 */

import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const NC = "\x1b[0m";

/**
 * Get all validator scripts
 * @returns {string[]}
 */
function getValidators() {
  const files = readdirSync(__dirname);
  return files
    .filter((f) => f.startsWith("validate-") && f.endsWith(".mjs"))
    .sort();
}

/**
 * Run a single validator
 * @param {string} validator
 * @returns {Promise<{ name: string; success: boolean; duration: number }>}
 */
function runValidator(validator) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const scriptPath = join(__dirname, validator);

    const child = spawn("node", [scriptPath], {
      cwd: join(__dirname, ".."),
      stdio: "pipe",
      env: { ...process.env, FORCE_COLOR: "1" },
    });

    let output = "";

    child.stdout?.on("data", (data) => {
      output += data.toString();
    });

    child.stderr?.on("data", (data) => {
      output += data.toString();
    });

    child.on("error", (error) => {
      resolve({
        name: validator,
        success: false,
        duration: Date.now() - startTime,
      });
    });

    child.on("exit", (code) => {
      const success = code === 0;
      const duration = Date.now() - startTime;

      // Only show output for failures
      if (!success && output.trim()) {
        console.log(output);
      }

      resolve({ name: validator, success, duration });
    });
  });
}

async function main() {
  const validators = getValidators();

  console.log(`${BLUE}Running ${validators.length} validators...${NC}\n`);

  const results = [];
  let hasFailure = false;

  for (const validator of validators) {
    const shortName = validator.replace("validate-", "").replace(".mjs", "");
    process.stdout.write(`  ${shortName.padEnd(30)}`);

    const result = await runValidator(validator);
    results.push(result);

    if (result.success) {
      console.log(`${GREEN}PASS${NC} (${result.duration}ms)`);
    } else {
      console.log(`${RED}FAIL${NC} (${result.duration}ms)`);
      hasFailure = true;
    }
  }

  // Summary
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n${BLUE}Summary:${NC}`);
  console.log(`  ${GREEN}Passed: ${passed}${NC}`);
  if (failed > 0) {
    console.log(`  ${RED}Failed: ${failed}${NC}`);
    console.log(`\n${RED}Failed validators:${NC}`);
    for (const result of results.filter((r) => !r.success)) {
      console.log(`  - ${result.name}`);
    }
  }
  console.log(`  Total time: ${totalTime}ms`);

  process.exit(hasFailure ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
