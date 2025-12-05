#!/usr/bin/env node
/**
 * Choragen CLI
 *
 * Commands for task chain management, governance, and validation.
 */

const args = process.argv.slice(2);
const command = args[0];

// Placeholder - full implementation in Phase 2
const commands: Record<string, string> = {
  // Chain lifecycle
  "chain:new": "Create a new task chain from a CR/FR",
  "chain:start": "Start working on a chain",
  "chain:status": "Show chain status",
  "chain:resume": "Resume a chain from file state",

  // Task lifecycle
  "task:start": "Start a task",
  "task:complete": "Mark task complete",
  "task:approve": "Approve completed task",
  "task:rework": "Send task back for rework",
  "task:block": "Mark task as blocked",

  // Queries
  "task:next": "Show next available task",
  "task:context": "Generate context for a task",

  // Governance
  "governance:check": "Check files against governance rules",

  // Locks
  "lock:acquire": "Acquire locks for a chain",
  "lock:release": "Release locks for a chain",
  "lock:status": "Show current lock status",

  // Validation
  "validate:links": "Validate design ↔ implementation links",
  "validate:test-coverage": "Validate design ↔ test links",
  "validate:adr-traceability": "Validate ADR ↔ implementation",

  // Hooks
  "hooks:install": "Install git hooks",
};

if (!command || command === "help" || command === "--help") {
  console.log("Choragen - The space that enables agents to actualize intent\n");
  console.log("Usage: choragen <command> [options]\n");
  console.log("Commands:");
  for (const [cmd, desc] of Object.entries(commands)) {
    console.log(`  ${cmd.padEnd(24)} ${desc}`);
  }
  process.exit(0);
}

if (commands[command]) {
  console.log(`Command '${command}' not yet implemented.`);
  console.log("Implementation coming in CR-20251205-005 (Phase 2).");
  process.exit(1);
} else {
  console.error(`Unknown command: ${command}`);
  console.error("Run 'choragen help' for available commands.");
  process.exit(1);
}
