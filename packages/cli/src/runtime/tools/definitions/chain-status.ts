// ADR: ADR-010-agent-runtime-architecture

import { ChainManager } from "@choragen/core";
import type { ToolDefinition } from "../types.js";
import type { ToolResult, ExecutionContext } from "../executor.js";

/**
 * Get the status of a task chain.
 * Available to both control and impl roles.
 */
export const chainStatusTool: ToolDefinition = {
  name: "chain:status",
  description:
    "Get the status of a task chain including its tasks and current progress",
  parameters: {
    type: "object",
    properties: {
      chainId: {
        type: "string",
        description: "Chain ID (e.g., CHAIN-037-agent-runtime-core)",
      },
    },
    required: ["chainId"],
  },
  category: "chain",
  mutates: false,
};

/**
 * Execute chain:status tool.
 * Reads chain from docs/tasks/ and returns status summary.
 */
export async function executeChainStatus(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const chainId = params.chainId as string;

  if (!chainId) {
    return {
      success: false,
      error: "Missing required parameter: chainId",
    };
  }

  const chainManager = new ChainManager(context.workspaceRoot);
  const summary = await chainManager.getChainSummary(chainId);

  if (!summary) {
    return {
      success: false,
      error: `Chain not found: ${chainId}`,
    };
  }

  return {
    success: true,
    data: {
      chainId: summary.chain.id,
      title: summary.chain.title,
      requestId: summary.chain.requestId,
      status: summary.status,
      progress: Math.round(summary.progress),
      taskCounts: summary.taskCounts,
      tasks: summary.chain.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        type: t.type || "impl",
      })),
    },
  };
}
