/**
 * @design-doc docs/design/core/features/standard-workflow.md
 * @test-type integration
 * @user-intent "Verify request closure gate blocks incomplete requests and allows force bypass"
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";
import { closeRequest } from "../commands/request-close.js";

const REQUEST_ID = "CR-TEST-002";

interface RequestOptions {
  commits?: string[];
  completionNotes?: string;
  acceptanceCriteria?: string[];
  linkedAdrs?: string[];
  statusDir?: "todo" | "doing";
}

async function initGitRepo(rootDir: string): Promise<void> {
  execSync("git init", { cwd: rootDir, stdio: "pipe" });
  execSync('git config user.email "test@test.com"', { cwd: rootDir, stdio: "pipe" });
  execSync('git config user.name "Test User"', { cwd: rootDir, stdio: "pipe" });
}

function gitCommit(rootDir: string, message: string): void {
  execSync("git add -A", { cwd: rootDir, stdio: "pipe" });
  execSync(`git commit -m "${message}" --allow-empty`, { cwd: rootDir, stdio: "pipe" });
}

async function createBaseProject(rootDir: string, reviewStatus: "approved" | "changes_requested" = "approved"): Promise<void> {
  const dirs = [
    "docs/requests/change-requests/todo",
    "docs/requests/change-requests/doing",
    "docs/requests/change-requests/done",
    "docs/requests/fix-requests/todo",
    "docs/requests/fix-requests/doing",
    "docs/requests/fix-requests/done",
    "docs/tasks/.chains",
  ];

  for (const dir of dirs) {
    await fs.mkdir(path.join(rootDir, dir), { recursive: true });
  }

  const chainMetaPath = path.join(rootDir, "docs/tasks/.chains/CHAIN-100-close.json");
  const chainMetadata = {
    id: "CHAIN-100-close",
    sequence: 100,
    slug: "close",
    requestId: REQUEST_ID,
    title: "Close validation chain",
    description: "",
    reviewStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await fs.writeFile(chainMetaPath, JSON.stringify(chainMetadata, null, 2), "utf-8");
}

async function writeRequestFile(rootDir: string, options: RequestOptions = {}): Promise<string> {
  const commits = options.commits ?? ["existing-commit"];
  const completionNotes = options.completionNotes ?? "Completed successfully.";
  const acceptance = options.acceptanceCriteria ?? ["- [x] All done"];
  const linkedAdrs = options.linkedAdrs ?? ["../../adr/done/ADR-001-task-file-format.md"];
  const statusDir = options.statusDir ?? "doing";

  const requestDir = path.join(rootDir, "docs/requests/change-requests", statusDir);
  const requestPath = path.join(requestDir, `${REQUEST_ID}-close.md`);

  const content = `# Change Request: Close Test

**ID**: ${REQUEST_ID}  
**Domain**: core  
**Status**: ${statusDir}  
**Created**: 2025-12-14  
**Owner**: tester  

---

## Commits

${commits.map((c) => `- ${c}`).join("\n")}

## Acceptance Criteria

${acceptance.join("\n")}

## Linked ADRs

${linkedAdrs.map((adr) => `- [ADR](${adr})`).join("\n")}

## Completion Notes

${completionNotes}
`;

  await fs.writeFile(requestPath, content, "utf-8");
  return requestPath;
}

describe("closeRequest with validation gate", () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-request-close-"));
    await createBaseProject(projectRoot);
  });

  afterEach(async () => {
    await fs.rm(projectRoot, { recursive: true, force: true });
  });

  it("blocks closing when validation fails", async () => {
    await writeRequestFile(projectRoot, { commits: [] });

    const result = await closeRequest(projectRoot, REQUEST_ID);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Validation failed");
  });

  it("closes request when validation succeeds", async () => {
    await initGitRepo(projectRoot);
    await writeRequestFile(projectRoot);
    // Create a commit that references the request ID so git log can find it
    await fs.writeFile(path.join(projectRoot, "README.md"), "test", "utf-8");
    gitCommit(projectRoot, `feat: add change [${REQUEST_ID}]`);

    const result = await closeRequest(projectRoot, REQUEST_ID);

    expect(result.success).toBe(true);
    expect(result.filePath).toContain("docs/requests/change-requests/done");
    const destPath = path.join(projectRoot, result.filePath!);
    const content = await fs.readFile(destPath, "utf-8");
    expect(content).toContain("## Commits");
    expect(content).toContain("feat: add change");
    expect(content).toContain("**Status**: done");
    expect(content).toContain("**Completed**:");
    // Original file should be moved
    const sourcePath = path.join(projectRoot, "docs/requests/change-requests/doing", `${REQUEST_ID}-close.md`);
    await expect(fs.access(sourcePath)).rejects.toThrow();
  });

  it("skips validation when force=true", async () => {
    await initGitRepo(projectRoot);
    await writeRequestFile(projectRoot, { completionNotes: "TODO", commits: [] });
    await fs.writeFile(path.join(projectRoot, "CHANGELOG.md"), "entry", "utf-8");
    gitCommit(projectRoot, `chore: update changelog (${REQUEST_ID})`);

    const result = await closeRequest(projectRoot, REQUEST_ID, { force: true });

    expect(result.success).toBe(true);
    const destPath = path.join(projectRoot, result.filePath!);
    const content = await fs.readFile(destPath, "utf-8");
    expect(content).toContain("chore: update changelog");
  });
});
