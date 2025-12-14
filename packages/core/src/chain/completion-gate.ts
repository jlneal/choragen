/**
 * Chain completion gate
 *
 * Runs chain validation on completion hooks and reports blocking feedback.
 *
 * ADR: ADR-001-task-file-format
 */

import { ChainManager } from "../tasks/chain-manager.js";
import { DEFAULT_TASK_CONFIG, type Chain, type TaskConfig } from "../tasks/types.js";
import {
  runChainValidation,
  type RunChainValidationOptions,
} from "./validation-runner.js";
import type { ChainCompletionGateResult } from "./validation-types.js";

export interface ChainCompletionGateOptions
  extends Omit<RunChainValidationOptions, "projectRoot"> {
  /** Project root for locating tasks and git metadata */
  projectRoot: string;
  /** Chain ID to validate */
  chainId: string;
  /** Optional chain instance (will fetch if missing tasks) */
  chain?: Chain | null;
}

/**
 * Execute completion validation for a chain.
 */
export async function runChainCompletionGate(
  options: ChainCompletionGateOptions
): Promise<ChainCompletionGateResult> {
  const { projectRoot, chainId } = options;
  const taskConfig: TaskConfig = { ...DEFAULT_TASK_CONFIG, ...(options.taskConfig || {}) };

  const chain = await resolveChain(projectRoot, chainId, taskConfig, options.chain);
  if (!chain) {
    return {
      chainId,
      valid: false,
      results: [
        {
          check: "task_state",
          success: false,
          feedback: [`Chain not found: ${chainId}`],
        },
      ],
      failedChecks: ["task_state"],
    };
  }

  return runChainValidation(chain, {
    ...options,
    projectRoot,
    taskConfig,
  });
}

async function resolveChain(
  projectRoot: string,
  chainId: string,
  taskConfig: TaskConfig,
  provided?: Chain | null
): Promise<Chain | null> {
  if (provided?.tasks && provided.tasks.length > 0) {
    return provided;
  }

  const manager = new ChainManager(projectRoot, taskConfig);
  return manager.getChain(chainId);
}
