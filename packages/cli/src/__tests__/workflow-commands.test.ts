/**
 * @design-doc docs/design/core/features/workflow-orchestration.md
 * @user-intent "Validate CLI workflow commands create, list, show status, approve, and advance workflows"
 * @test-type integration
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { execSync, type ExecSyncOptions } from "node:child_process";

const CLI_PATH = path.resolve(__dirname, "../../dist/bin.js");
const WORKFLOW_ID_PATTERN = /WF-\d{8}-\d{3}/;

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
    const stdout = execSync(`node ${CLI_PATH} ${args.join(" ")}`, options) as string;
    return { stdout, stderr: "", exitCode: 0 };
  } catch (error) {
    const execError = error as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: execError.stdout || "",
      stderr: execError.stderr || "",
      exitCode: execError.status || 1,
    };
  }
}

async function createRequest(projectRoot: string, requestId: string): Promise<void> {
  const filePath = path.join(
    projectRoot,
    "docs/requests/change-requests/todo",
    `${requestId}-test.md`
  );
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(
    filePath,
    `# Change Request: Test\n\n**ID**: ${requestId}\n**Status**: todo\n`,
    "utf-8"
  );
}

describe("CLI workflow commands", () => {
  let tempDir: string;

  beforeAll(() => {
    // Ensure dist reflects latest sources
    execSync("pnpm --filter @choragen/cli build", { stdio: "pipe" });
  });

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-workflow-cli-"));
    await fs.mkdir(path.join(tempDir, ".choragen"), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("fails to start workflow when request is missing", () => {
    const result = runCli(["workflow:start", "CR-404"], tempDir);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Request not found");
  });

  it("creates, lists, shows status, approves, and advances a workflow", async () => {
    const requestId = "CR-20251210-TEST";
    await createRequest(tempDir, requestId);

    // Start workflow
    const startResult = runCli(["workflow:start", requestId], tempDir);
    expect(startResult.exitCode).toBe(0);
    const workflowId = (startResult.stdout.match(WORKFLOW_ID_PATTERN) || [])[0];
    expect(workflowId).toBeTruthy();
    expect(startResult.stdout).toContain("Created workflow");

    // Status should show stage/gate info
    const statusResult = runCli(["workflow:status", workflowId!], tempDir);
    expect(statusResult.exitCode).toBe(0);
    expect(statusResult.stdout).toContain("Stage 1 of");
    expect(statusResult.stdout).toContain("Gate: human_approval");

    // List with status filter
    const listResult = runCli(["workflow:list", "--status=active"], tempDir);
    expect(listResult.exitCode).toBe(0);
    expect(listResult.stdout).toContain(workflowId!);

    // Advance should fail until gate approved
    const advanceFail = runCli(["workflow:advance", workflowId!], tempDir);
    expect(advanceFail.exitCode).toBe(1);
    expect(advanceFail.stderr).toContain("Gate not satisfied");

    // Approve gate and advance
    const approveResult = runCli(["workflow:approve", workflowId!], tempDir);
    expect(approveResult.exitCode).toBe(0);
    expect(approveResult.stdout).toContain("Approved gate");

    const advanceOk = runCli(["workflow:advance", workflowId!], tempDir);
    expect(advanceOk.exitCode).toBe(0);
    expect(advanceOk.stdout).toContain("Stage 2 of");
  });
});
