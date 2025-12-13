/**
 * Role-based tool access types
 *
 * Design doc: docs/design/core/features/role-based-tool-access.md
 */

// ADR: ADR-004-agent-role-separation

/** Dynamic role definition for workflow stages */
export interface Role {
  /** Unique role identifier (e.g., "researcher", "implementer") */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of the role's purpose */
  description?: string;
  /** Tool IDs this role can use */
  toolIds: string[];
  /** Optional model configuration for this role */
  model?: RoleModelConfig;
  /** Optional system prompt to prime the model */
  systemPrompt?: string;
  /** When the role was created */
  createdAt: Date;
  /** When the role was last updated */
  updatedAt: Date;
}

/** Model configuration for a role */
export interface RoleModelConfig {
  /** LLM provider (anthropic, openai, etc.) */
  provider: string;
  /** Model identifier */
  model: string;
  /** Temperature (0.0 - 1.0) */
  temperature: number;
  /** Max tokens for response (optional) */
  maxTokens?: number;
  /** Additional provider-specific options */
  options?: Record<string, unknown>;
}

/** JSON Schema definition for tool parameters */
export interface ToolParameterSchema {
  type: "object";
  properties: Record<
    string,
    {
      type: string;
      description?: string;
      enum?: string[];
      items?: { type: string };
    }
  >;
  required?: string[];
}

/** Metadata about a tool for UI display and role assignment */
export interface ToolMetadata {
  /** Tool identifier (e.g., "read_file", "chain:status") */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what the tool does */
  description: string;
  /** Category for UI grouping */
  category: string;
  /** JSON Schema for parameters */
  parameters: ToolParameterSchema;
  /** Whether this tool can modify state (for UI hints) */
  mutates: boolean;
}

/** Category to group tools for browsing and selection */
export interface ToolCategory {
  /** Category identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /** Display order */
  order: number;
}

export const DEFAULT_TOOL_CATEGORIES = [
  {
    id: "filesystem",
    name: "Filesystem",
    description: "File operations",
    order: 1,
  },
  {
    id: "search",
    name: "Search",
    description: "Search operations",
    order: 2,
  },
  {
    id: "chain",
    name: "Chain",
    description: "Chain management",
    order: 3,
  },
  {
    id: "task",
    name: "Task",
    description: "Task management",
    order: 4,
  },
  {
    id: "session",
    name: "Session",
    description: "Session management",
    order: 5,
  },
  {
    id: "command",
    name: "Command",
    description: "Shell commands",
    order: 6,
  },
] as const satisfies readonly ToolCategory[];
