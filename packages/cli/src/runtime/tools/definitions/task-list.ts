// ADR: ADR-010-agent-runtime-architecture

import { TaskManager, type TaskStatus } from "@choragen/core";
import type { ToolDefinition } from "../types.js";
import type { ToolResult, ExecutionContext } from "../executor.js";

/**
 * List all tasks in a chain.
 * Available only to control role (they manage task workflow).
 */
export const taskListTool: ToolDefinition = {
  name: "task:list",
  description: "List all tasks in a chain with their current status",
  parameters: {
    type: "object",
    properties: {
      chainId: {
        type: "string",
        description: "Chain ID (e.g., CHAIN-037-agent-runtime-core)",
      },
      status: {
        type: "string",
        description: "Filter by task status",
        enum: ["todo", "in-progress", "in-review", "done", "blocked"],
      },
    },
    required: ["chainId"],
  },
  category: "task",
  mutates: false,
};

/**
 * Execute task:list tool.
 * Lists tasks in a chain directory, optionally filtered by status.
 */
export async function executeTaskList(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const chainId = params.chainId as string;
  const statusFilter = params.status as TaskStatus | undefined;

  if (!chainId) {
    return {
      success: false,
      error: "Missing required parameter: chainId",
    };
  }

  const taskManager = new TaskManager(context.workspaceRoot);
  let tasks = await taskManager.getTasksForChain(chainId);

  if (tasks.length === 0) {
    return {
      success: true,
      data: {
        chainId,
        tasks: [],
        count: 0,
      },
    };
  }

  // Apply status filter if provided
  if (statusFilter) {
    tasks = tasks.filter((t) => t.status === statusFilter);
  }

  return {
    success: true,
    data: {
      chainId,
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        type: t.type || "impl",
        sequence: t.sequence,
      })),
      count: tasks.length,
    },
  };
}
