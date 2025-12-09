// ADR: ADR-010-agent-runtime-architecture

/**
 * Tool registry exports for the agent runtime.
 */

// Types
export type { AgentRole, ToolDefinition } from "./types.js";
export { toProviderTool } from "./types.js";

// Registry
export { ToolRegistry, defaultRegistry } from "./registry.js";

// Executor
export type {
  ToolResult,
  ExecutionContext,
  ToolExecutorFn,
  NestedSessionContext,
  ChildSessionConfig,
  ChildSessionResult,
} from "./executor.js";
export { ToolExecutor, defaultExecutor } from "./executor.js";

// Tool definitions
export { chainStatusTool, executeChainStatus } from "./definitions/chain-status.js";
export { taskStatusTool, executeTaskStatus } from "./definitions/task-status.js";
export { taskListTool, executeTaskList } from "./definitions/task-list.js";
export { taskStartTool, executeTaskStart } from "./definitions/task-start.js";
export { taskCompleteTool, executeTaskComplete } from "./definitions/task-complete.js";
export { taskApproveTool, executeTaskApprove } from "./definitions/task-approve.js";
export { spawnImplSessionTool, executeSpawnImplSession } from "./definitions/spawn-impl-session.js";

// Governance gate
export type { ToolCall, ValidationResult } from "../governance-gate.js";
export { GovernanceGate, defaultGovernanceGate } from "../governance-gate.js";
