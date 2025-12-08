// ADR: ADR-010-agent-runtime-architecture

/**
 * Prompt loader for building role-specific system prompts with dynamic context.
 * Assembles base role instructions with session metadata and available tools.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { AgentRole } from "./tools/types.js";

/**
 * Session context for prompt assembly.
 */
export interface SessionContext {
  /** Unique session identifier */
  sessionId: string;
  /** Active chain ID (if assigned) */
  chainId?: string;
  /** Active task ID (if assigned) */
  taskId?: string;
  /** Workspace root directory */
  workspaceRoot: string;
  /** List of available tools for this session */
  availableTools: ToolSummary[];
}

/**
 * Summary of a tool for prompt inclusion.
 */
export interface ToolSummary {
  /** Tool name (e.g., "chain:status") */
  name: string;
  /** Brief description of what the tool does */
  description: string;
}

/**
 * Fallback prompts when agent docs are not found.
 */
const FALLBACK_PROMPTS: Record<AgentRole, string> = {
  control: `# Control Agent Role

You are a control agent responsible for managing work but NOT implementing.

## Responsibilities
- Create and manage task chains
- Review completed work
- Approve or send back for rework
- Commit and push completed chains

## What You Must NOT Do
- Never implement code directly
- Never skip the CR/FR process
- Never approve your own implementation`,

  impl: `# Implementation Agent Role

You are an implementation agent responsible for executing tasks from task files.

## Responsibilities
- Read task files and understand requirements
- Implement per acceptance criteria
- Run verification commands
- Report completion

## What You Must NOT Do
- Never move task files
- Never approve your own work
- Never create new tasks
- Never skip acceptance criteria`,
};

/**
 * Loads and assembles role-specific system prompts.
 */
export class PromptLoader {
  private docsPath: string;

  /**
   * Create a new PromptLoader.
   * @param workspaceRoot - Root directory of the workspace
   */
  constructor(workspaceRoot: string) {
    this.docsPath = join(workspaceRoot, "docs", "agents");
  }

  /**
   * Load and assemble a complete system prompt for the given role and context.
   * @param role - Agent role ("control" or "impl")
   * @param context - Session context with chain/task info and available tools
   * @returns Complete system prompt string
   */
  async load(role: AgentRole, context: SessionContext): Promise<string> {
    const basePrompt = await this.loadBasePrompt(role);
    const sessionSection = this.buildSessionSection(role, context);
    const toolsSection = this.buildToolsSection(context.availableTools);
    const footer = this.buildFooter();

    return [basePrompt, "---", sessionSection, toolsSection, "---", footer].join(
      "\n\n"
    );
  }

  /**
   * Load the base prompt from the agent docs file.
   * Falls back to a default prompt if the file is not found.
   * @param role - Agent role
   * @returns Base prompt content
   */
  private async loadBasePrompt(role: AgentRole): Promise<string> {
    const filename = role === "control" ? "control-agent.md" : "impl-agent.md";
    const filePath = join(this.docsPath, filename);

    try {
      const content = await readFile(filePath, "utf-8");
      return content.trim();
    } catch {
      // File not found or unreadable, use fallback
      return FALLBACK_PROMPTS[role];
    }
  }

  /**
   * Build the current session section of the prompt.
   * @param role - Agent role
   * @param context - Session context
   * @returns Session section markdown
   */
  private buildSessionSection(role: AgentRole, context: SessionContext): string {
    const lines: string[] = ["## Current Session", ""];
    lines.push(`- **Session ID**: ${context.sessionId}`);
    lines.push(`- **Role**: ${role}`);

    if (context.chainId) {
      lines.push(`- **Chain**: ${context.chainId}`);
    }

    if (context.taskId) {
      lines.push(`- **Task**: ${context.taskId}`);
    }

    return lines.join("\n");
  }

  /**
   * Build the available tools section of the prompt.
   * @param tools - List of available tools
   * @returns Tools section markdown
   */
  private buildToolsSection(tools: ToolSummary[]): string {
    if (tools.length === 0) {
      return "## Available Tools\n\nNo tools available for this session.";
    }

    const lines: string[] = ["## Available Tools", ""];
    for (const tool of tools) {
      lines.push(`- **${tool.name}** — ${tool.description}`);
    }

    return lines.join("\n");
  }

  /**
   * Build the footer section of the prompt.
   * @returns Footer markdown
   */
  private buildFooter(): string {
    return "You are operating within the Choragen agent runtime. All tool calls will be validated against governance rules before execution.";
  }
}

/**
 * Create tool summaries from tool definitions for prompt inclusion.
 * @param tools - Array of tool objects with name and description
 * @returns Array of ToolSummary objects
 */
export function createToolSummaries(
  tools: Array<{ name: string; description: string }>
): ToolSummary[] {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
  }));
}
