// ADR: ADR-010-agent-runtime-architecture

import { WorkflowManager } from "@choragen/core";
import type { ToolDefinition } from "../types.js";
import type { ToolResult, ExecutionContext } from "../executor.js";

/**
 * Trigger an approval prompt for the current workflow stage.
 * Used when gates are marked as agent-triggered to let the agent decide when to ask for approval.
 */
export const requestApprovalTool: ToolDefinition = {
  name: "request_approval",
  description: "Request human approval for the current workflow stage when the gate is agent-triggered",
  parameters: {
    type: "object",
    properties: {
      workflowId: {
        type: "string",
        description: "Workflow ID (e.g., WF-20250101-001)",
      },
    },
    required: ["workflowId"],
  },
  category: "workflow",
  mutates: true,
};

/**
 * Execute request_approval tool.
 * Adds a gate prompt message for the current stage when allowed.
 */
export async function executeRequestApproval(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const workflowId = params.workflowId as string;

  if (!workflowId) {
    return {
      success: false,
      error: "Missing required parameter: workflowId",
    };
  }

  const manager = new WorkflowManager(context.workspaceRoot);

  try {
    const workflow = await manager.triggerGatePrompt(workflowId);
    const stage = workflow.stages[workflow.currentStage];

    return {
      success: true,
      data: {
        workflowId: workflow.id,
        stageIndex: workflow.currentStage,
        gateType: stage?.gate.type,
        prompt: stage?.gate.prompt,
        messageCount: workflow.messages.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to trigger gate prompt",
    };
  }
}
