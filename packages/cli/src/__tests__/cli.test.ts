/**
 * @design-doc docs/design/core/features/cli-commands.md
 * @user-intent "Verify CLI commands work correctly for basic operations including help, chain management, task management, and error handling"
 * @test-type smoke
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { execSync, type ExecSyncOptions } from "node:child_process";

// Path to the CLI entry point (built)
const CLI_PATH = path.resolve(__dirname, "../../dist/bin.js");

/**
 * Run the CLI command and return stdout/stderr
 */
function runCli(
  args: string[],
  cwd: string
): { stdout: string; stderr: string; exitCode: number } {
  const options: ExecSyncOptions = {
    cwd,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  };

  try {
    const stdout = execSync(
      `node ${CLI_PATH} ${args.join(" ")}`,
      options
    ) as string;
    return { stdout, stderr: "", exitCode: 0 };
  } catch (error) {
    const execError = error as {
      stdout?: string;
      stderr?: string;
      status?: number;
    };
    return {
      stdout: execError.stdout || "",
      stderr: execError.stderr || "",
      exitCode: execError.status || 1,
    };
  }
}

/**
 * Create the standard task directory structure
 */
async function createTaskDirs(baseDir: string): Promise<void> {
  const dirs = [
    "docs/tasks/.chains",
    "docs/tasks/backlog",
    "docs/tasks/todo",
    "docs/tasks/in-progress",
    "docs/tasks/in-review",
    "docs/tasks/done",
    "docs/tasks/blocked",
    ".choragen",
  ];
  for (const dir of dirs) {
    await fs.mkdir(path.join(baseDir, dir), { recursive: true });
  }
}

describe("CLI Smoke Tests", () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a temp directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-cli-test-"));
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("--help flag", () => {
    it("shows help when called with --help", () => {
      const result = runCli(["--help"], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Choragen");
      expect(result.stdout).toContain("Usage:");
      expect(result.stdout).toContain("Commands:");
    });

    it("shows help when called with -h", () => {
      const result = runCli(["-h"], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Usage:");
    });

    it("shows help when called with no arguments", () => {
      const result = runCli([], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Usage:");
    });

    it("shows help when called with help command", () => {
      const result = runCli(["help"], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Usage:");
      expect(result.stdout).toContain("chain:new");
      expect(result.stdout).toContain("task:add");
    });
  });

  describe("chain:list command", () => {
    it("lists chains when none exist", async () => {
      await createTaskDirs(tempDir);

      const result = runCli(["chain:list"], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("No chains found");
    });
  });

  describe("chain:new command", () => {
    it("creates a new chain with required arguments", async () => {
      await createTaskDirs(tempDir);

      const result = runCli(
        ["chain:new", "CR-20251207-001", "test-chain", "Test Chain"],
        tempDir
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Created chain:");
      expect(result.stdout).toContain("CHAIN-001-test-chain");
    });

    it("shows error when missing required arguments", () => {
      const result = runCli(["chain:new"], tempDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Usage:");
    });

    it("creates chain with type flag", async () => {
      await createTaskDirs(tempDir);

      const result = runCli(
        [
          "chain:new",
          "CR-20251207-001",
          "design-chain",
          "Design Chain",
          "--type=design",
        ],
        tempDir
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Created chain:");
      expect(result.stdout).toContain("Type: design");
    });
  });

  describe("task:add command", () => {
    it("adds a task to an existing chain", async () => {
      await createTaskDirs(tempDir);

      // Create chain first
      runCli(["chain:new", "CR-001", "task-test", "Task Test"], tempDir);

      // Add task
      const result = runCli(
        ["task:add", "CHAIN-001-task-test", "first-task", "First Task Title"],
        tempDir
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Created task:");
      expect(result.stdout).toContain("001-first-task");
    });

    it("shows error when missing required arguments", () => {
      const result = runCli(["task:add"], tempDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Usage:");
    });

    it("shows error when chain does not exist", async () => {
      await createTaskDirs(tempDir);

      const result = runCli(
        ["task:add", "CHAIN-999-nonexistent", "task", "Task Title"],
        tempDir
      );

      // Should fail because chain doesn't exist
      expect(result.exitCode).toBe(1);
    });
  });

  describe("invalid commands", () => {
    it("shows error for unknown command", () => {
      const result = runCli(["unknown:command"], tempDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Unknown command:");
      expect(result.stderr).toContain("unknown:command");
    });

    it("shows error for invalid command format", () => {
      const result = runCli(["not-a-valid-command"], tempDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Unknown command:");
    });

    it("suggests running help for unknown commands", () => {
      const result = runCli(["foobar"], tempDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("choragen help");
    });
  });

  describe("chain:status command", () => {
    it("shows status for existing chain", async () => {
      await createTaskDirs(tempDir);

      // Create chain first
      runCli(["chain:new", "CR-001", "status-test", "Status Test"], tempDir);

      // Get status
      const result = runCli(["chain:status", "CHAIN-001-status-test"], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Chain:");
      expect(result.stdout).toContain("Status:");
    });

    it("shows error for non-existent chain", async () => {
      await createTaskDirs(tempDir);

      const result = runCli(
        ["chain:status", "CHAIN-999-nonexistent"],
        tempDir
      );

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Chain not found");
    });
  });

  describe("task:list command", () => {
    it("lists tasks for a chain", async () => {
      await createTaskDirs(tempDir);

      // Create chain and task
      runCli(["chain:new", "CR-001", "list-test", "List Test"], tempDir);
      runCli(
        ["task:add", "CHAIN-001-list-test", "task-one", "Task One"],
        tempDir
      );

      // List tasks
      const result = runCli(["task:list", "CHAIN-001-list-test"], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("001-task-one");
      expect(result.stdout).toContain("Tasks for CHAIN-001-list-test");
    });

    it("shows error when missing chain-id argument", () => {
      const result = runCli(["task:list"], tempDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Usage:");
    });

    it("shows rework indicators for reworked tasks", async () => {
      await createTaskDirs(tempDir);

      // Create chain
      runCli(["chain:new", "CR-001", "rework-list", "Rework List"], tempDir);

      // Manually create original task with reworkCount
      const origTaskDir = path.join(tempDir, "docs/tasks/in-review/CHAIN-001-rework-list");
      await fs.mkdir(origTaskDir, { recursive: true });
      const origTaskContent = `# Task: Implementation Task

**Chain**: CHAIN-001-rework-list  
**Task**: 001-impl-task  
**Status**: in-review  
**Rework-Count**: 1  

---

## Objective

Test task
`;
      await fs.writeFile(path.join(origTaskDir, "001-impl-task.md"), origTaskContent);

      // Manually create rework task
      const reworkTaskDir = path.join(tempDir, "docs/tasks/todo/CHAIN-001-rework-list");
      await fs.mkdir(reworkTaskDir, { recursive: true });
      const reworkTaskContent = `# Task: Implementation Task (Rework 1)

**Chain**: CHAIN-001-rework-list  
**Task**: 001-impl-task-rework-1  
**Status**: todo  
**Rework-Of**: 001-impl-task  
**Rework-Reason**: Needs fixes  

---

## Objective

Rework task
`;
      await fs.writeFile(path.join(reworkTaskDir, "001-impl-task-rework-1.md"), reworkTaskContent);

      // List tasks - should show rework indicators
      const result = runCli(["task:list", "CHAIN-001-rework-list"], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("[reworked: 1]");
      expect(result.stdout).toContain("[rework of: 001-impl-task]");
    });
  });

  describe("task:status command", () => {
    it("shows task status details", async () => {
      await createTaskDirs(tempDir);

      // Create chain and task
      runCli(["chain:new", "CR-001", "status-task", "Status Task"], tempDir);
      runCli(
        ["task:add", "CHAIN-001-status-task", "my-task", "My Task Title"],
        tempDir
      );

      // Get task status
      const result = runCli(
        ["task:status", "CHAIN-001-status-task", "001-my-task"],
        tempDir
      );

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Task: 001-my-task");
      expect(result.stdout).toContain("Status: backlog");
      expect(result.stdout).toContain("Title: My Task Title");
    });

    it("shows error when missing arguments", () => {
      const result = runCli(["task:status"], tempDir);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Usage:");
    });

    it("shows error for non-existent task", async () => {
      await createTaskDirs(tempDir);

      // Create chain
      runCli(["chain:new", "CR-001", "status-err", "Status Error"], tempDir);

      const result = runCli(
        ["task:status", "CHAIN-001-status-err", "999-nonexistent"],
        tempDir
      );

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("Task not found");
    });

    it("shows rework relationship for rework task", async () => {
      await createTaskDirs(tempDir);

      // Create chain
      runCli(["chain:new", "CR-001", "rework-status", "Rework Status"], tempDir);

      // Manually create original task with reworkCount
      const origTaskDir = path.join(tempDir, "docs/tasks/in-review/CHAIN-001-rework-status");
      await fs.mkdir(origTaskDir, { recursive: true });
      const origTaskContent = `# Task: Original Task

**Chain**: CHAIN-001-rework-status  
**Task**: 001-orig-task  
**Status**: in-review  
**Rework-Count**: 1  

---

## Objective

Original task description
`;
      await fs.writeFile(path.join(origTaskDir, "001-orig-task.md"), origTaskContent);

      // Manually create rework task
      const reworkTaskDir = path.join(tempDir, "docs/tasks/todo/CHAIN-001-rework-status");
      await fs.mkdir(reworkTaskDir, { recursive: true });
      const reworkTaskContent = `# Task: Original Task (Rework 1)

**Chain**: CHAIN-001-rework-status  
**Task**: 001-orig-task-rework-1  
**Status**: todo  
**Rework-Of**: 001-orig-task  
**Rework-Reason**: Missing tests  

---

## Objective

Rework task description
`;
      await fs.writeFile(path.join(reworkTaskDir, "001-orig-task-rework-1.md"), reworkTaskContent);

      // Check status of rework task
      const reworkResult = runCli(
        ["task:status", "CHAIN-001-rework-status", "001-orig-task-rework-1"],
        tempDir
      );

      expect(reworkResult.exitCode).toBe(0);
      expect(reworkResult.stdout).toContain("(Rework)");
      expect(reworkResult.stdout).toContain("Rework Of: 001-orig-task");
      expect(reworkResult.stdout).toContain("Rework Reason: Missing tests");

      // Check status of original task shows rework count
      const origResult = runCli(
        ["task:status", "CHAIN-001-rework-status", "001-orig-task"],
        tempDir
      );

      expect(origResult.exitCode).toBe(0);
      expect(origResult.stdout).toContain("Rework Count: 1");
      expect(origResult.stdout).toContain("Rework Tasks:");
      expect(origResult.stdout).toContain("001-orig-task-rework-1");
    });
  });

  describe("lock:status command", () => {
    it("shows lock status", async () => {
      await createTaskDirs(tempDir);

      const result = runCli(["lock:status"], tempDir);

      expect(result.exitCode).toBe(0);
      // Should show some status output (even if no locks)
    });
  });
});
