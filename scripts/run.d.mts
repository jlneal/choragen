/**
 * Type definitions for the Choragen task runner
 */

/**
 * Configuration for a single task
 */
export interface TaskConfig {
  /** The command to execute (e.g., "pnpm", "node") */
  command: string;
  /** Arguments to pass to the command */
  args: string[];
  /** Human-readable description of the task */
  description: string;
  /** Whether to forward CLI arguments to the command */
  forwardArgs?: boolean;
}

/**
 * Parsed command-line arguments
 */
export interface ParsedArgs {
  /** The task name to execute */
  task: string | undefined;
  /** Arguments to forward to the task */
  forwardedArgs: string[];
  /** Whether to output JSON */
  jsonOutput: boolean;
  /** Whether to show help */
  showHelp: boolean;
}

/**
 * JSON output structure for successful operations
 */
export interface SuccessOutput {
  success: true;
  exitCode?: number;
  output?: unknown;
  stderr?: string;
}

/**
 * JSON output structure for failed operations
 */
export interface ErrorOutput {
  success: false;
  error: string;
  stdout?: string;
  stderr?: string;
}

/**
 * JSON output for help command
 */
export interface HelpOutput {
  success: true;
  commands: Array<{
    name: string;
    description: string;
  }>;
}

/**
 * All possible task names
 */
export type TaskName =
  // Build & Test
  | "build"
  | "test"
  | "typecheck"
  | "lint"
  // Validation
  | "validate:all"
  | "validate:links"
  | "validate:adr"
  | "validate:adr-staleness"
  | "validate:agents"
  | "validate:chain-types"
  | "validate:commits"
  | "validate:complete"
  | "validate:contracts"
  | "validate:design-docs"
  | "validate:request-completion"
  | "validate:request-staleness"
  | "validate:source-adr"
  | "validate:test-coverage"
  // Planning
  | "cr:new"
  | "fr:new"
  | "adr:new"
  // Utilities
  | "work:incomplete"
  | "pre-push"
  | "setup";
