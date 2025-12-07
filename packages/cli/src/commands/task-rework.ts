// ADR: ADR-001-task-file-format

/**
 * Task rework command - create a new rework task for a completed/in-review task
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { ChainManager, type Task, type TaskStatus } from "@choragen/core";

export interface ReworkTaskResult {
  success: boolean;
  originalTask?: Task;
  reworkTask?: Task;
  reworkTaskPath?: string;
  error?: string;
}

export interface ReworkTaskOptions {
  chainId: string;
  taskId: string;
  reason: string;
}

/**
 * Get the task file path for a given status
 */
function getTaskPath(
  projectRoot: string,
  chainId: string,
  taskId: string,
  status: TaskStatus
): string {
  return path.join(projectRoot, "docs/tasks", status, chainId, `${taskId}.md`);
}

/**
 * Count existing rework tasks for a given original task
 */
async function countExistingReworks(
  projectRoot: string,
  chainId: string,
  originalTaskId: string
): Promise<number> {
  const statusDirs: TaskStatus[] = ["backlog", "todo", "in-progress", "in-review", "done", "blocked"];
  let count = 0;

  for (const status of statusDirs) {
    const chainDir = path.join(projectRoot, "docs/tasks", status, chainId);
    try {
      const files = await fs.readdir(chainDir);
      for (const file of files) {
        // Match pattern: {originalTaskId}-rework-{n}.md
        const reworkPattern = new RegExp(`^${originalTaskId}-rework-\\d+\\.md$`);
        if (reworkPattern.test(file)) {
          count++;
        }
      }
    } catch {
      // Directory doesn't exist, continue
    }
  }

  return count;
}

/**
 * Create a rework task for an existing task
 *
 * Behavior:
 * 1. Validate task exists and is in done/in-review status
 * 2. Determine rework number (count existing reworks + 1)
 * 3. Create new task file: {task-id}-rework-{n}.md
 * 4. Set new task fields: reworkOf, reworkReason, status: todo
 * 5. Increment reworkCount on original task
 * 6. Return result with handoff info
 */
export async function createReworkTask(
  projectRoot: string,
  options: ReworkTaskOptions
): Promise<ReworkTaskResult> {
  const { chainId, taskId, reason } = options;

  const chainManager = new ChainManager(projectRoot);
  const taskManager = chainManager.getTaskManager();

  // 1. Validate chain exists
  const chain = await chainManager.getChain(chainId);
  if (!chain) {
    const allChains = await chainManager.getAllChains();
    const suggestions = allChains
      .filter((c) => c.id.toLowerCase().includes(chainId.toLowerCase()))
      .map((c) => c.id)
      .slice(0, 3);

    let errorMsg = `Chain not found: ${chainId}`;
    if (suggestions.length > 0) {
      errorMsg += `\nDid you mean: ${suggestions.join(", ")}?`;
    }
    return { success: false, error: errorMsg };
  }

  // 2. Validate task exists
  const task = await taskManager.getTask(chainId, taskId);
  if (!task) {
    const tasks = await taskManager.getTasksForChain(chainId);
    const taskList = tasks.map((t) => `  - ${t.id} [${t.status}]`).join("\n");
    return {
      success: false,
      error: `Task not found: ${taskId}\nAvailable tasks in ${chainId}:\n${taskList}`,
    };
  }

  // 3. Validate task is in done or in-review status
  const validStatuses: TaskStatus[] = ["done", "in-review"];
  if (!validStatuses.includes(task.status)) {
    return {
      success: false,
      error: `Task ${taskId} is in '${task.status}' status. Rework can only be created for tasks in: ${validStatuses.join(", ")}`,
    };
  }

  // 4. Determine rework number
  const existingReworks = await countExistingReworks(projectRoot, chainId, taskId);
  const reworkNumber = existingReworks + 1;
  const reworkTaskId = `${taskId}-rework-${reworkNumber}`;

  // 5. Create the rework task
  // Parse the original task ID to get sequence and slug
  const idMatch = taskId.match(/^(\d+)-(.+)$/);
  if (!idMatch) {
    return {
      success: false,
      error: `Invalid task ID format: ${taskId}`,
    };
  }

  const originalSequence = parseInt(idMatch[1], 10);
  const reworkSlug = `${idMatch[2]}-rework-${reworkNumber}`;

  // Create task content
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const reworkTaskContent = `# Task: ${task.title} (Rework ${reworkNumber})

**Chain**: ${chainId}  
**Task**: ${reworkTaskId}  
**Status**: todo  
**Created**: ${dateStr}
**Rework-Of**: ${taskId}  
**Rework-Reason**: ${reason}  

---

## Objective

Rework of task ${taskId}: ${task.title}

**Rework Reason**: ${reason}

## Original Task Reference

See original task for full context: ${taskId}

## Acceptance Criteria

${task.acceptance.length > 0 ? task.acceptance.map((a) => `- [ ] ${a}`).join("\n") : "- [ ] Address rework feedback"}
- [ ] Verify rework reason has been addressed

## Notes

This is rework ${reworkNumber} for the original task.
`;

  // Write the rework task file
  const reworkTaskDir = path.join(projectRoot, "docs/tasks/todo", chainId);
  await fs.mkdir(reworkTaskDir, { recursive: true });

  const reworkTaskPath = path.join(reworkTaskDir, `${reworkTaskId}.md`);
  await fs.writeFile(reworkTaskPath, reworkTaskContent, "utf-8");

  // 6. Increment reworkCount on original task
  const originalTaskPath = getTaskPath(projectRoot, chainId, taskId, task.status);
  let originalContent = await fs.readFile(originalTaskPath, "utf-8");

  // Update or add reworkCount
  if (originalContent.includes("**Rework-Count**:")) {
    originalContent = originalContent.replace(
      /\*\*Rework-Count\*\*:\s*\d+/,
      `**Rework-Count**: ${(task.reworkCount || 0) + 1}`
    );
  } else {
    // Add after Status line
    originalContent = originalContent.replace(
      /(\*\*Status\*\*:\s*[^\n]+)/,
      `$1\n**Rework-Count**: ${(task.reworkCount || 0) + 1}  `
    );
  }

  await fs.writeFile(originalTaskPath, originalContent, "utf-8");

  // Return result
  const reworkTask: Task = {
    id: reworkTaskId,
    sequence: originalSequence,
    slug: reworkSlug,
    status: "todo",
    chainId,
    title: `${task.title} (Rework ${reworkNumber})`,
    description: `Rework of task ${taskId}`,
    expectedFiles: task.expectedFiles,
    acceptance: task.acceptance,
    constraints: task.constraints,
    notes: `Rework ${reworkNumber} for original task`,
    createdAt: now,
    updatedAt: now,
    reworkOf: taskId,
    reworkReason: reason,
  };

  return {
    success: true,
    originalTask: { ...task, reworkCount: (task.reworkCount || 0) + 1 },
    reworkTask,
    reworkTaskPath: path.relative(projectRoot, reworkTaskPath),
  };
}

/**
 * Format the result for CLI output
 */
export function formatReworkResult(result: ReworkTaskResult): string {
  if (!result.success) {
    return `❌ ${result.error}`;
  }

  const lines: string[] = [];
  lines.push(`Creating rework task for ${result.originalTask!.id}...`);
  lines.push(`  Original task: ${result.originalTask!.id} (${result.originalTask!.status})`);
  lines.push(`  Rework reason: ${result.reworkTask!.reworkReason}`);
  lines.push(`  Created: ${result.reworkTask!.id}`);
  lines.push(`  Path: ${result.reworkTaskPath}`);
  lines.push(`✅ Rework task created`);
  lines.push("");
  lines.push("Handoff to impl agent:");
  lines.push(`  Chain: ${result.reworkTask!.chainId}`);
  lines.push(`  Task: ${result.reworkTask!.id}`);

  return lines.join("\n");
}
