/**
 * @design-doc docs/design/core/features/pipeline-metrics.md
 * @user-intent "Verify metrics:import command correctly reconstructs historical events from git history"
 * @test-type unit
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
    "docs/requests/change-requests/todo",
    "docs/requests/change-requests/doing",
    "docs/requests/change-requests/done",
    "docs/requests/fix-requests/todo",
    "docs/requests/fix-requests/doing",
    "docs/requests/fix-requests/done",
    ".choragen/metrics",
  ];
  for (const dir of dirs) {
    await fs.mkdir(path.join(baseDir, dir), { recursive: true });
  }
}

/**
 * Initialize a git repo in the temp directory
 */
async function initGitRepo(dir: string): Promise<void> {
  execSync("git init", { cwd: dir, stdio: "pipe" });
  execSync('git config user.email "test@test.com"', { cwd: dir, stdio: "pipe" });
  execSync('git config user.name "Test User"', { cwd: dir, stdio: "pipe" });
}

/**
 * Create a commit with the given message
 */
function gitCommit(dir: string, message: string): void {
  execSync(`git add -A && git commit -m "${message}" --allow-empty`, {
    cwd: dir,
    stdio: "pipe",
  });
}

describe("metrics:import command", () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a temp directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-metrics-import-test-"));
    await createTaskDirs(tempDir);
    await initGitRepo(tempDir);
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe("basic functionality", () => {
    it("runs with --dry-run flag", async () => {
      const result = runCli(["metrics:import", "--dry-run"], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("dry run");
    });

    it("shows no events when git history is empty", async () => {
      // Make an initial commit so git log works
      gitCommit(tempDir, "Initial commit");

      const result = runCli(["metrics:import", "--dry-run"], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("No new events to import");
    });
  });

  describe("chain:created detection", () => {
    it("detects chain creation from chain.yaml file", async () => {
      // Create chain metadata file
      const chainYaml = `id: CHAIN-001-test
requestId: CR-20241201-001
title: Test Chain
createdAt: 2024-12-01T00:00:00Z
`;
      await fs.writeFile(
        path.join(tempDir, "docs/tasks/.chains/CHAIN-001-test.yaml"),
        chainYaml
      );
      gitCommit(tempDir, "Create chain CHAIN-001-test");

      const result = runCli(["metrics:import", "--dry-run"], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("chain:created");
    });
  });

  describe("task:started detection", () => {
    it("detects task creation as task:started", async () => {
      // Create chain first
      const chainYaml = `id: CHAIN-001-test
requestId: CR-20241201-001
title: Test Chain
`;
      await fs.mkdir(path.join(tempDir, "docs/tasks/.chains"), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, "docs/tasks/.chains/CHAIN-001-test.yaml"),
        chainYaml
      );
      gitCommit(tempDir, "Create chain");

      // Create task directory and file
      const taskDir = path.join(tempDir, "docs/tasks/todo/CHAIN-001-test");
      await fs.mkdir(taskDir, { recursive: true });
      const taskContent = `# Task: Test Task

**Chain**: CHAIN-001-test  
**Task**: 001-test-task  
**Status**: todo  

---

## Objective

Test task
`;
      await fs.writeFile(path.join(taskDir, "001-test-task.md"), taskContent);
      gitCommit(tempDir, "Add task 001-test-task");

      const result = runCli(["metrics:import", "--dry-run"], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("task:started");
    });
  });

  describe("task:completed detection", () => {
    it("detects task moved to done/ as task:completed", async () => {
      // Create chain
      const chainYaml = `id: CHAIN-001-test
requestId: CR-20241201-001
title: Test Chain
`;
      await fs.writeFile(
        path.join(tempDir, "docs/tasks/.chains/CHAIN-001-test.yaml"),
        chainYaml
      );
      gitCommit(tempDir, "Create chain");

      // Create task in todo
      const todoDir = path.join(tempDir, "docs/tasks/todo/CHAIN-001-test");
      await fs.mkdir(todoDir, { recursive: true });
      const taskContent = `# Task: Test Task

**Chain**: CHAIN-001-test  
**Task**: 001-test-task  
**Status**: todo  

---

## Objective

Test task
`;
      await fs.writeFile(path.join(todoDir, "001-test-task.md"), taskContent);
      gitCommit(tempDir, "Add task");

      // Move task to done using git mv
      const doneDir = path.join(tempDir, "docs/tasks/done/CHAIN-001-test");
      await fs.mkdir(doneDir, { recursive: true });
      execSync(
        `git mv "docs/tasks/todo/CHAIN-001-test/001-test-task.md" "docs/tasks/done/CHAIN-001-test/001-test-task.md"`,
        { cwd: tempDir, stdio: "pipe" }
      );
      gitCommit(tempDir, "Complete task");

      const result = runCli(["metrics:import", "--dry-run"], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("task:completed");
    });
  });

  describe("task:rework detection", () => {
    it("detects rework task creation", async () => {
      // Create chain
      const chainYaml = `id: CHAIN-001-test
requestId: CR-20241201-001
title: Test Chain
`;
      await fs.writeFile(
        path.join(tempDir, "docs/tasks/.chains/CHAIN-001-test.yaml"),
        chainYaml
      );
      gitCommit(tempDir, "Create chain");

      // Create rework task
      const taskDir = path.join(tempDir, "docs/tasks/todo/CHAIN-001-test");
      await fs.mkdir(taskDir, { recursive: true });
      const reworkContent = `# Task: Test Task (Rework 1)

**Chain**: CHAIN-001-test  
**Task**: 001-test-task-rework-1  
**Status**: todo  
**Rework-Of**: 001-test-task  

---

## Objective

Rework task
`;
      await fs.writeFile(path.join(taskDir, "001-test-task-rework-1.md"), reworkContent);
      gitCommit(tempDir, "Create rework task");

      const result = runCli(["metrics:import", "--dry-run"], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("task:rework");
    });
  });

  describe("request:closed detection", () => {
    it("detects request moved to done/ as request:closed", async () => {
      // Create request in doing
      const doingDir = path.join(tempDir, "docs/requests/change-requests/doing");
      const requestContent = `# Change Request: Test Feature

**ID**: CR-20241201-001
**Domain**: core
**Status**: doing
`;
      await fs.writeFile(
        path.join(doingDir, "CR-20241201-001-test-feature.md"),
        requestContent
      );
      gitCommit(tempDir, "Create request");

      // Move request to done using git mv
      execSync(
        `git mv "docs/requests/change-requests/doing/CR-20241201-001-test-feature.md" "docs/requests/change-requests/done/CR-20241201-001-test-feature.md"`,
        { cwd: tempDir, stdio: "pipe" }
      );
      gitCommit(tempDir, "Close request");

      const result = runCli(["metrics:import", "--dry-run"], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("request:closed");
    });
  });

  describe("--since flag", () => {
    it("filters events by date", async () => {
      // Create chain
      const chainYaml = `id: CHAIN-001-test
requestId: CR-20241201-001
title: Test Chain
`;
      await fs.writeFile(
        path.join(tempDir, "docs/tasks/.chains/CHAIN-001-test.yaml"),
        chainYaml
      );
      gitCommit(tempDir, "Create chain");

      // Run with a future date - should find nothing
      const result = runCli(["metrics:import", "--dry-run", "--since=2099-01-01"], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("No new events to import");
    });
  });

  describe("duplicate detection", () => {
    it("skips duplicate events on re-import", async () => {
      // Create chain
      const chainYaml = `id: CHAIN-001-test
requestId: CR-20241201-001
title: Test Chain
`;
      await fs.writeFile(
        path.join(tempDir, "docs/tasks/.chains/CHAIN-001-test.yaml"),
        chainYaml
      );
      gitCommit(tempDir, "Create chain");

      // First import
      const firstResult = runCli(["metrics:import"], tempDir);
      expect(firstResult.exitCode).toBe(0);
      expect(firstResult.stdout).toContain("Imported");

      // Second import - should detect duplicates
      const secondResult = runCli(["metrics:import", "--dry-run"], tempDir);
      expect(secondResult.exitCode).toBe(0);
      // Should show duplicates were skipped or new events is 0
      expect(secondResult.stdout).toContain("New events: 0");
    });
  });

  describe("actual import", () => {
    it("writes events to metrics file without --dry-run", async () => {
      // Create chain
      const chainYaml = `id: CHAIN-001-test
requestId: CR-20241201-001
title: Test Chain
`;
      await fs.writeFile(
        path.join(tempDir, "docs/tasks/.chains/CHAIN-001-test.yaml"),
        chainYaml
      );
      gitCommit(tempDir, "Create chain");

      // Import without dry-run
      const result = runCli(["metrics:import"], tempDir);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Imported");

      // Verify events file was created
      const eventsPath = path.join(tempDir, ".choragen/metrics/events.jsonl");
      const eventsContent = await fs.readFile(eventsPath, "utf-8");
      expect(eventsContent).toContain("chain:created");
      expect(eventsContent).toContain("importedFromGit");
    });
  });
});
