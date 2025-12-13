// ADR: ADR-013-agent-tools-design

import { ChainManager } from "@choragen/core";
import type { ToolDefinition } from "./types.js";
import type { ToolResult, ExecutionContext } from "./executor.js";

type ChainEventPayload = Record<string, unknown>;

async function emitChainEvent(
  context: ExecutionContext,
  eventType: string,
  payload: ChainEventPayload
): Promise<void> {
  if (!context.eventEmitter) return;
  try {
    await context.eventEmitter({ type: eventType, payload });
  } catch {
    // Event emission failures should not block tool execution
  }
}

export const chainApproveTool: ToolDefinition = {
  name: "chain:approve",
  description: "Approve a chain after review",
  parameters: {
    type: "object",
    properties: {
      chainId: {
        type: "string",
        description: "Chain ID (e.g., CHAIN-037-agent-runtime-core)",
      },
      reason: {
        type: "string",
        description: "Optional approval note or justification",
      },
    },
    required: ["chainId"],
  },
  category: "chain",
  mutates: true,
};

export async function executeChainApprove(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const chainId = params.chainId as string;
  const reason = params.reason as string | undefined;

  if (!chainId) {
    return { success: false, error: "Missing required parameter: chainId" };
  }

  const chainManager = new ChainManager(context.workspaceRoot);
  const chain = await chainManager.getChain(chainId);
  if (!chain) {
    return { success: false, error: `Chain not found: ${chainId}` };
  }

  const payload = { chainId, title: chain.title, reason: reason ?? null };
  await emitChainEvent(context, "chain.approved", payload);

  return {
    success: true,
    data: payload,
  };
}

export const chainRequestChangesTool: ToolDefinition = {
  name: "chain:request_changes",
  description: "Request changes on a chain after review",
  parameters: {
    type: "object",
    properties: {
      chainId: {
        type: "string",
        description: "Chain ID (e.g., CHAIN-037-agent-runtime-core)",
      },
      reason: {
        type: "string",
        description: "Reason for requesting changes",
      },
    },
    required: ["chainId", "reason"],
  },
  category: "chain",
  mutates: true,
};

export async function executeChainRequestChanges(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const chainId = params.chainId as string;
  const reason = params.reason as string | undefined;

  if (!chainId) {
    return { success: false, error: "Missing required parameter: chainId" };
  }

  if (!reason) {
    return { success: false, error: "Missing required parameter: reason" };
  }

  const chainManager = new ChainManager(context.workspaceRoot);
  const chain = await chainManager.getChain(chainId);
  if (!chain) {
    return { success: false, error: `Chain not found: ${chainId}` };
  }

  const payload = { chainId, title: chain.title, reason };
  await emitChainEvent(context, "chain.changes_requested", payload);

  return {
    success: true,
    data: payload,
  };
}
