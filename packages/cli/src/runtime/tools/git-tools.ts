// ADR: ADR-013-agent-tools-design

import { exec as childExec } from "node:child_process";
import { promisify } from "node:util";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import type { ToolDefinition } from "./types.js";
import type { ToolResult, ExecutionContext } from "./executor.js";

const exec = promisify(childExec);

const COMMIT_MESSAGE_REGEX =
  /^(feat|fix|docs|test|refactor|chore)\([^)]+\):.+\n\n\[(CR|FR)-\d{8}-\d{3}\]$/;

async function runGit(
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string }> {
  const { stdout, stderr } = await exec(`git ${args.join(" ")}`, { cwd });
  return { stdout: stdout.trim(), stderr: stderr?.trim() ?? "" };
}

function validateCommitMessage(message: string): string | null {
  if (!COMMIT_MESSAGE_REGEX.test(message.trim())) {
    return "Invalid commit message format. Expected: <type>(<scope>): <description>\\n\\n[CR-xxxxxxx-xxx|FR-xxxxxxx-xxx]";
  }
  return null;
}

export const gitStatusTool: ToolDefinition = {
  name: "git:status",
  description: "Show git status (short)",
  parameters: {
    type: "object",
    properties: {},
  },
  category: "git",
  mutates: false,
};

export async function executeGitStatus(
  _params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  try {
    const { stdout } = await runGit(["status", "--short", "--branch"], context.workspaceRoot);
    return { success: true, data: { output: stdout } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "git status failed",
    };
  }
}

export const gitDiffTool: ToolDefinition = {
  name: "git:diff",
  description: "Show git diff for optional files; supports staged diff",
  parameters: {
    type: "object",
    properties: {
      files: {
        type: "array",
        items: { type: "string" },
        description: "Optional list of files to diff",
      },
      staged: {
        type: "boolean",
        description: "Show staged diff instead of working tree",
      },
    },
  },
  category: "git",
  mutates: false,
};

export async function executeGitDiff(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const files = params.files as string[] | undefined;
  const staged = Boolean(params.staged);
  const args = ["diff"];
  if (staged) args.push("--staged");
  if (files && Array.isArray(files) && files.length > 0) {
    args.push(...files);
  }

  try {
    const { stdout } = await runGit(args, context.workspaceRoot);
    return { success: true, data: { output: stdout } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "git diff failed",
    };
  }
}

export const gitCommitTool: ToolDefinition = {
  name: "git:commit",
  description: "Create a git commit with validated message format",
  parameters: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "Commit message (must include CR/FR reference)",
      },
      files: {
        type: "array",
        items: { type: "string" },
        description: "Optional list of files to stage before commit",
      },
    },
    required: ["message"],
  },
  category: "git",
  mutates: true,
};

export async function executeGitCommit(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const message = params.message as string;
  const files = params.files as string[] | undefined;

  if (!message) {
    return { success: false, error: "Missing required parameter: message" };
  }

  const validationError = validateCommitMessage(message);
  if (validationError) {
    return { success: false, error: validationError };
  }

  try {
    if (files && Array.isArray(files) && files.length > 0) {
      await runGit(["add", ...files], context.workspaceRoot);
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-commit-"));
    const msgPath = path.join(tempDir, "MESSAGE.txt");
    await fs.writeFile(msgPath, message, "utf-8");

    const { stdout } = await runGit(["commit", "-F", msgPath], context.workspaceRoot);
    await fs.rm(tempDir, { recursive: true, force: true });
    return { success: true, data: { output: stdout } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "git commit failed",
    };
  }
}

export const gitBranchTool: ToolDefinition = {
  name: "git:branch",
  description: "Create or checkout a branch (deletion not allowed)",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Branch name",
      },
      action: {
        type: "string",
        enum: ["create", "checkout"],
        description: "Branch action",
      },
    },
    required: ["name", "action"],
  },
  category: "git",
  mutates: true,
};

export async function executeGitBranch(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const name = params.name as string;
  const action = params.action as string;

  if (!name) return { success: false, error: "Missing required parameter: name" };
  if (!action) return { success: false, error: "Missing required parameter: action" };

  if (action === "create") {
  try {
    const { stdout } = await runGit(["branch", name], context.workspaceRoot);
    return { success: true, data: { output: stdout } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "git branch create failed",
      };
    }
  }

  if (action === "checkout") {
    try {
      const { stdout } = await runGit(["checkout", name], context.workspaceRoot);
      return { success: true, data: { output: stdout } };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "git branch checkout failed",
      };
    }
  }

  return { success: false, error: "Invalid action. Only create or checkout are allowed." };
}

export const gitPushTool: ToolDefinition = {
  name: "git:push",
  description: "Push commits to remote (no force push allowed)",
  parameters: {
    type: "object",
    properties: {
      remote: {
        type: "string",
        description: "Remote name (default: origin)",
      },
      branch: {
        type: "string",
        description: "Branch name (default: current)",
      },
    },
  },
  category: "git",
  mutates: true,
};

async function getCurrentBranch(cwd: string): Promise<string> {
  const { stdout } = await runGit(["rev-parse", "--abbrev-ref", "HEAD"], cwd);
  return stdout;
}

export async function executeGitPush(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const remote = (params.remote as string) || "origin";
  const branch = (params.branch as string) || (await getCurrentBranch(context.workspaceRoot));

  try {
    const { stdout } = await runGit(["push", remote, branch], context.workspaceRoot);
    return { success: true, data: { output: stdout, remote, branch } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "git push failed",
    };
  }
}
