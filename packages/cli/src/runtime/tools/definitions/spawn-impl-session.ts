// ADR: ADR-010-agent-runtime-architecture

import type { ToolDefinition } from "../types.js";
import type { ToolResult, ExecutionContext, NestedSessionContext } from "../executor.js";

/**
 * Spawn a nested impl agent session.
 * Available only to control role (they delegate work to impl agents).
 */
export const spawnImplSessionTool: ToolDefinition = {
  name: "spawn_impl_session",
  description:
    "Spawn a nested implementation agent session to work on a specific task. " +
    "The impl agent will execute with its own isolated context and return results when complete.",
  parameters: {
    type: "object",
    properties: {
      chainId: {
        type: "string",
        description: "Chain ID (e.g., CHAIN-037-agent-runtime-core)",
      },
      taskId: {
        type: "string",
        description: "Task ID to assign to the impl agent",
      },
      context: {
        type: "string",
        description: "Additional context or instructions for the impl agent",
      },
    },
    required: ["chainId", "taskId"],
  },
  allowedRoles: ["control"],
};

/**
 * Type guard to check if context has nested session capabilities.
 */
function isNestedSessionContext(
  context: ExecutionContext
): context is NestedSessionContext {
  return (
    "sessionId" in context &&
    "nestingDepth" in context &&
    "maxNestingDepth" in context
  );
}

/**
 * Execute spawn_impl_session tool.
 * Spawns a nested impl agent session to work on a specific task.
 */
export async function executeSpawnImplSession(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const chainId = params.chainId as string;
  const taskId = params.taskId as string;
  const additionalContext = params.context as string | undefined;

  // Validate required parameters
  if (!chainId) {
    return {
      success: false,
      error: "Missing required parameter: chainId",
    };
  }

  if (!taskId) {
    return {
      success: false,
      error: "Missing required parameter: taskId",
    };
  }

  // Check if we have nested session context
  if (!isNestedSessionContext(context)) {
    return {
      success: false,
      error: "Nested session context not available. This tool requires the extended execution context.",
      data: {
        chainId,
        taskId,
        hint: "Ensure the agent runtime is configured with nested session support.",
      },
    };
  }

  // Check nesting depth limit
  const nextDepth = context.nestingDepth + 1;
  if (nextDepth > context.maxNestingDepth) {
    return {
      success: false,
      error: `Maximum nesting depth (${context.maxNestingDepth}) would be exceeded. Current depth: ${context.nestingDepth}`,
      data: {
        chainId,
        taskId,
        currentDepth: context.nestingDepth,
        maxDepth: context.maxNestingDepth,
      },
    };
  }

  // Check if spawn function is available
  if (!context.spawnChildSession) {
    return {
      success: false,
      error: "Child session spawning not configured. The spawnChildSession function is not available.",
      data: {
        chainId,
        taskId,
        hint: "This may indicate the runtime was not properly initialized for nested sessions.",
      },
    };
  }

  // Log the spawn attempt
  console.log(`[spawn_impl_session] Spawning impl session for task ${taskId} in chain ${chainId}`);
  console.log(`[spawn_impl_session] Current depth: ${context.nestingDepth}, next depth: ${nextDepth}`);

  try {
    // Spawn the child session
    const result = await context.spawnChildSession({
      chainId,
      taskId,
      context: additionalContext,
    });

    if (result.success) {
      return {
        success: true,
        data: {
          message: "Impl session completed successfully",
          childSessionId: result.sessionId,
          iterations: result.iterations,
          tokensUsed: result.tokensUsed,
          summary: result.summary,
        },
      };
    } else {
      return {
        success: false,
        error: result.error || "Child session failed",
        data: {
          childSessionId: result.sessionId,
          iterations: result.iterations,
          tokensUsed: result.tokensUsed,
        },
      };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[spawn_impl_session] Error spawning child session: ${errorMessage}`);
    return {
      success: false,
      error: `Failed to spawn child session: ${errorMessage}`,
      data: {
        chainId,
        taskId,
      },
    };
  }
}
