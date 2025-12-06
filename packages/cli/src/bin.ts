#!/usr/bin/env node
// ADR: ADR-001-task-file-format

/**
 * Choragen CLI
 *
 * Commands for task chain management, governance, and validation.
 */

import { run } from "./cli.js";

run(process.argv.slice(2)).catch((error: Error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
