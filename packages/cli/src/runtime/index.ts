// ADR: ADR-010-agent-runtime-architecture

/**
 * Agent runtime public exports.
 * Provides the core agentic loop and all supporting components.
 */

// Agentic loop
export type {
  AgentSessionConfig,
  SessionResult,
  ToolCallRecord,
  LoopDependencies,
  AgentSessionEvents,
} from "./loop.js";
export { runAgentSession } from "./loop.js";

// LLM Providers
export type {
  LLMProvider,
  Message,
  MessageRole,
  Tool,
  ToolParameterSchema,
  ToolCall,
  ChatResponse,
  StopReason,
  TokenUsage,
  StreamChunk,
  ProviderConfig,
  ProviderName,
} from "./providers/index.js";
export {
  DEFAULT_MODELS,
  DEFAULT_MAX_TOKENS,
  AnthropicProvider,
  OpenAIProvider,
  GeminiProvider,
  createProvider,
  createProviderFromEnv,
  getApiKeyFromEnv,
  getProviderFromEnv,
  ProviderError,
} from "./providers/index.js";

// Tools
export type {
  AgentRole,
  ToolDefinition,
  ToolResult,
  ExecutionContext,
  ToolExecutorFn,
  AuditLogCallback,
} from "./tools/index.js";
export {
  toProviderTool,
  ToolRegistry,
  defaultRegistry,
  ToolExecutor,
  defaultExecutor,
  buildDeniedAuditEntry,
} from "./tools/index.js";

// Governance
export type { ValidationResult } from "./governance-gate.js";
export { GovernanceGate, defaultGovernanceGate } from "./governance-gate.js";
// Re-export ToolCall from governance-gate for validation context
export type { ToolCall as GovernanceToolCall } from "./governance-gate.js";

// Prompt loader
export type { SessionContext, ToolSummary } from "./prompt-loader.js";
export { PromptLoader, createToolSummaries } from "./prompt-loader.js";

// Retry logic
export type { RetryConfig, RetryResult, RetryableError } from "./retry.js";
export {
  withRetry,
  withRetryWrapper,
  isRetryableError,
  calculateBackoffDelay,
  sleep,
  DEFAULT_RETRY_CONFIG,
  RETRYABLE_STATUS_CODES,
  RETRYABLE_ERROR_TYPES,
} from "./retry.js";

// Session state
export type {
  SessionOutcome,
  SessionStatus,
  SessionError,
  SessionSummary,
  SessionTokenUsage,
  SessionGovernanceResult,
  SessionToolCall,
  SessionData,
  SessionConfig,
  AuditLogEntry,
} from "./session.js";
export { Session, AuditLogger } from "./session.js";

// Cost tracking
export type {
  ModelPricing,
  TokenUsage as CostTokenUsage,
  LimitCheckResult,
  CostTrackerConfig,
  CostSnapshot,
} from "./cost-tracker.js";
export {
  CostTracker,
  MODEL_PRICING,
  DEFAULT_PRICING,
  getCostLimitsFromEnv,
} from "./cost-tracker.js";

// Checkpoint system
export type {
  ApprovalResult,
  CheckpointConfig,
  ApprovalContext,
  ApprovalCallback,
} from "./checkpoint.js";
export {
  CheckpointHandler,
  SENSITIVE_ACTIONS,
  createCheckpointHandler,
  defaultCheckpointHandler,
  getApprovalTimeoutFromEnv,
  DEFAULT_APPROVAL_TIMEOUT,
} from "./checkpoint.js";

// Graceful shutdown
export type {
  ShutdownState,
  ShutdownCallback,
  ShutdownConfig,
} from "./shutdown.js";
export {
  ShutdownHandler,
  createShutdownHandler,
  defaultShutdownHandler,
} from "./shutdown.js";
