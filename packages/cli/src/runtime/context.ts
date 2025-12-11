// ADR: ADR-011-workflow-orchestration

/**
 * Workflow-aware session context helpers.
 *
 * Loads workflow state when a session is bound to a workflow and exposes
 * stage details for tool filtering and message logging.
 */

import { WorkflowManager, type Workflow, type WorkflowStage, type StageType } from "@choragen/core";

export interface WorkflowSessionContext {
  workflow: Workflow;
  stage: WorkflowStage;
  stageIndex: number;
  stageType: StageType;
  manager: WorkflowManager;
}

/**
 * Load workflow context if workflowId is provided.
 * - Validates workflow exists
 * - Uses provided stageIndex or defaults to currentStage
 * - Verifies the requested stageIndex matches the workflow's currentStage
 */
export async function loadWorkflowSessionContext(
  workspaceRoot: string,
  workflowId?: string,
  stageIndex?: number
): Promise<WorkflowSessionContext | null> {
  if (!workflowId) return null;

  const manager = new WorkflowManager(workspaceRoot);
  const workflow = await manager.get(workflowId);
  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowId}`);
  }

  const effectiveStageIndex = stageIndex ?? workflow.currentStage;
  if (effectiveStageIndex !== workflow.currentStage) {
    throw new Error(
      `Workflow ${workflowId} is at stage ${workflow.currentStage}, not ${effectiveStageIndex}`
    );
  }

  const stage = workflow.stages[effectiveStageIndex];
  if (!stage) {
    throw new Error(`Stage ${effectiveStageIndex} not found for workflow ${workflowId}`);
  }

  return {
    workflow,
    stage,
    stageIndex: effectiveStageIndex,
    stageType: stage.type,
    manager,
  };
}
