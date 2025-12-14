/**
 * Stage-scoped tool availability matrix.
 *
 * The matrix is derived from docs/design/core/features/workflow-orchestration.md
 * and is used to layer stage-based filtering on top of role-based filtering.
 *
 * Note: This only encodes tool *names*. Role-based access control and any
 * additional path or governance constraints are applied separately.
 *
 * @adr ADR-011-workflow-orchestration
 */

import type { StageType } from "./types.js";

/** Stage → allowed tool names */
export const STAGE_TOOL_MATRIX: Record<StageType, readonly string[]> = {
  request: [
    "request:create",
    "chain:status",
    "read_file",
    "list_files",
    "search_files",
    "task:status",
    "task:list",
  ],
  design: [
    "chain:new",
    "chain:status",
    "task:add",
    "task:status",
    "task:list",
    "feedback:create",
    "read_file",
    "write_file", // docs authoring
    "list_files",
    "search_files",
  ],
  review: [
    "chain:status",
    "chain:approve",
    "chain:request_changes",
    "task:approve",
    "task:request_changes",
    "request:approve",
    "request:request_changes",
    "task:status",
    "task:list",
    "read_file",
    "list_files",
    "search_files",
    "gate:satisfy",
  ],
  implementation: [
    "chain:status",
    "task:start",
    "task:submit",
    "task:complete",
    "task:status",
    "task:list",
    "feedback:create",
    "read_file",
    "write_file",
    "list_files",
    "search_files",
    "spawn_impl_session",
    "run_command",
  ],
  verification: [
    "chain:status",
    "task:status",
    "task:list",
    "read_file",
    "list_files",
    "search_files",
    "run_command",
    "gate:satisfy",
  ],
  ideation: [
    "request:create",
    "request_approval",
    "task:status",
    "task:list",
    "feedback:create",
    "read_file",
    "write_file",
    "list_files",
    "search_files",
  ],
  reflection: [
    "feedback:create",
    "read_file",
    "write_file",
    "list_files",
    "search_files",
  ],
} as const;

/**
 * Return allowed tool names for a given stage type.
 */
export function getStageTools(stage: StageType): ReadonlySet<string> {
  return new Set(STAGE_TOOL_MATRIX[stage] || []);
}

/**
 * Check if a tool is allowed for the given stage.
 */
export function isToolAllowedForStage(stage: StageType, toolName: string): boolean {
  return getStageTools(stage).has(toolName);
}
