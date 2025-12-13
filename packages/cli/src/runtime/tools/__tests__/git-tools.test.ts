/**
 * @design-doc docs/adr/done/ADR-013-agent-tools-design.md
 * @test-type unit
 * @user-intent "Verify git tools execute status, diff, commit, branch, and push operations correctly"
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { exec as childExec } from "node:child_process";
import { promisify } from "node:util";
import {
  executeGitStatus,
  executeGitDiff,
  executeGitCommit,
  executeGitBranch,
  executeGitPush,
} from "../git-tools.js";
import type { ExecutionContext } from "../executor.js";

const exec = promisify(childExec);

async function initRepo(cwd: string): Promise<void> {
  await exec("git init", { cwd });
  await exec('git config user.email "test@example.com"', { cwd });
  await exec('git config user.name "Test User"', { cwd });
}

describe("git tools", () => {
  let tempDir: string;
  let context: ExecutionContext;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-git-"));
    await initRepo(tempDir);
    context = { role: "control", workspaceRoot: tempDir };
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("returns git status", async () => {
    const result = await executeGitStatus({}, context);
    expect(result.success).toBe(true);
    expect((result.data as { output: string }).output).toContain("##");
  });

  it("shows diff for a file", async () => {
    const filePath = path.join(tempDir, "file.txt");
    await fs.writeFile(filePath, "hello");
    await exec("git add file.txt", { cwd: tempDir });
    const result = await executeGitDiff({ files: ["file.txt"], staged: true }, context);
    expect(result.success).toBe(true);
    expect((result.data as { output: string }).output).toContain("hello");
  });

  it("validates commit message format", async () => {
    const result = await executeGitCommit({ message: "bad message" }, context);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid commit message format");
  });

  it("creates a commit with valid message", async () => {
    const filePath = path.join(tempDir, "file.txt");
    await fs.writeFile(filePath, "hello");
    const result = await executeGitCommit(
      { message: "chore(test): add file\n\n[CR-20250101-001]", files: ["file.txt"] },
      context
    );
    expect(result.success).toBe(true);
  });

  it("creates and checks out branches without delete support", async () => {
    // Seed an initial commit so branch operations succeed
    await fs.writeFile(path.join(tempDir, "seed.txt"), "seed");
    await executeGitCommit(
      { message: "chore(test): seed branch\n\n[CR-20250101-003]", files: ["seed.txt"] },
      context
    );

    const create = await executeGitBranch({ name: "feature/test", action: "create" }, context);
    expect(create.success).toBe(true);

    const checkout = await executeGitBranch({ name: "feature/test", action: "checkout" }, context);
    expect(checkout.success).toBe(true);

    const invalid = await executeGitBranch({ name: "feature/test", action: "delete" }, context);
    expect(invalid.success).toBe(false);
  });

  it("pushes to a local bare remote", async () => {
    // Prepare a bare remote
    const bareDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-git-remote-"));
    await exec("git init --bare", { cwd: bareDir });

    // Add commit to main repo
    await fs.writeFile(path.join(tempDir, "push.txt"), "push");
    await executeGitCommit(
      { message: "chore(test): add push file\n\n[CR-20250101-002]", files: ["push.txt"] },
      context
    );

    await exec(`git remote add origin ${bareDir}`, { cwd: tempDir });
    const { stdout: branchStdout } = await exec("git rev-parse --abbrev-ref HEAD", { cwd: tempDir });
    const currentBranch = branchStdout.trim();
    const result = await executeGitPush({}, context);
    expect(result.success).toBe(true);
    expect((result.data as { branch: string }).branch).toBe(currentBranch);
  });
});
