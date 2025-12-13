// ADR: ADR-013-agent-tools-design

import type { ToolDefinition } from "./types.js";
import type { ToolResult, ExecutionContext, NestedSessionContext } from "./executor.js";

const ALLOWED_ROLES = [
  "impl",
  "design",
  "review",
  "ideation",
  "commit",
  "orchestration",
  "control",
];

function isNestedSessionContext(context: ExecutionContext): context is NestedSessionContext {
  return (
    "sessionId" in context &&
    "nestingDepth" in context &&
    "maxNestingDepth" in context
  );
}

function canSpawnRole(currentRole: string, targetRole: string): boolean {
  if (currentRole === "control" || currentRole === "orchestration") {
    return true;
  }
  // Prevent privilege escalation from non-control roles
  return currentRole === targetRole;
}

export const spawnAgentTool: ToolDefinition = {
  name: "spawn_agent",
  description: "Spawn a nested agent session for a specified role.",
  parameters: {
    type: "object",
    properties: {
      role: {
        type: "string",
        description: "Role for the spawned agent (impl, design, review, ideation, commit, orchestration, control)",
      },
      chainId: {
        type: "string",
        description: "Optional chain context",
      },
      taskId: {
        type: "string",
        description: "Optional task context",
      },
      context: {
        type: "string",
        description: "Additional instructions for the spawned agent",
      },
    },
    required: ["role"],
  },
  category: "session",
  mutates: true,
};

export async function executeSpawnAgent(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const role = params.role as string;
  const chainId = params.chainId as string | undefined;
  const taskId = params.taskId as string | undefined;
  const additionalContext = params.context as string | undefined;

  if (!role) {
    return { success: false, error: "Missing required parameter: role" };
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return { success: false, error: `Invalid role: ${role}` };
  }

  if (!canSpawnRole(context.role, role)) {
    return {
      success: false,
      error: `Role ${context.role} cannot spawn higher-privilege role ${role}`,
    };
  }

  if (!isNestedSessionContext(context)) {
    return {
      success: false,
      error: "Nested session context not available. This tool requires the extended execution context.",
      data: { role, chainId: chainId ?? null, taskId: taskId ?? null },
    };
  }

  const nextDepth = context.nestingDepth + 1;
  if (nextDepth > context.maxNestingDepth) {
    return {
      success: false,
      error: `Maximum nesting depth (${context.maxNestingDepth}) would be exceeded. Current depth: ${context.nestingDepth}`,
      data: {
        role,
        chainId: chainId ?? null,
        taskId: taskId ?? null,
        currentDepth: context.nestingDepth,
        maxDepth: context.maxNestingDepth,
      },
    };
  }

  if (!context.spawnChildSession) {
    return {
      success: false,
      error: "Child session spawning not configured. The spawnChildSession function is not available.",
      data: { role, chainId: chainId ?? null, taskId: taskId ?? null },
    };
  }

  console.log(`[spawn_agent] Spawning child session for role ${role}`);
  console.log(`[spawn_agent] Current depth: ${context.nestingDepth}, next depth: ${nextDepth}`);

  try {
    const childResult = await context.spawnChildSession({
      role,
      roleId: role,
      chainId: chainId ?? context.chainId ?? "",
      taskId: taskId ?? context.taskId ?? "",
      context: additionalContext,
    });

    if (childResult.success) {
      return {
        success: true,
        data: {
          message: "Child session completed successfully",
          childSessionId: childResult.sessionId,
          iterations: childResult.iterations,
          tokensUsed: childResult.tokensUsed,
          summary: childResult.summary,
          role,
        },
      };
    }

    return {
      success: false,
      error: childResult.error || "Child session failed",
      data: {
        childSessionId: childResult.sessionId,
        iterations: childResult.iterations,
        tokensUsed: childResult.tokensUsed,
        role,
      },
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[spawn_agent] Error spawning child session: ${errorMessage}`);
    return {
      success: false,
      error: `Failed to spawn child session: ${errorMessage}`,
      data: { role, chainId: chainId ?? null, taskId: taskId ?? null },
    };
  }
}
