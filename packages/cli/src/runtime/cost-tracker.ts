// ADR: ADR-010-agent-runtime-architecture

/**
 * Cost tracking for agent sessions.
 * Tracks token usage and estimates cost based on model pricing.
 * Supports configurable limits with warning thresholds and hard stops.
 */

/**
 * Cost per million tokens for supported models.
 * Prices as of late 2024.
 */
export interface ModelPricing {
  input: number;
  output: number;
}

/**
 * Model pricing table (cost per 1M tokens in USD).
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Anthropic models
  "claude-sonnet-4-20250514": { input: 3.0, output: 15.0 },
  "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0 },
  "claude-3-5-haiku-20241022": { input: 1.0, output: 5.0 },
  "claude-3-opus-20240229": { input: 15.0, output: 75.0 },
  // OpenAI models
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10.0, output: 30.0 },
  "gpt-4": { input: 30.0, output: 60.0 },
  // Gemini models
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "gemini-1.5-pro": { input: 1.25, output: 5.0 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
};

/**
 * Default pricing for unknown models (conservative estimate).
 */
export const DEFAULT_PRICING: ModelPricing = { input: 3.0, output: 15.0 };

/**
 * Warning threshold as a percentage of limit (0.0 - 1.0).
 */
const WARNING_THRESHOLD = 0.8;

/**
 * Token usage statistics.
 */
export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

/**
 * Result of checking limits.
 */
export interface LimitCheckResult {
  /** Whether the warning threshold (80%) has been reached */
  warning: boolean;
  /** Whether the hard limit (100%) has been exceeded */
  exceeded: boolean;
  /** Current usage as a percentage of the limit (0.0 - 1.0), null if no limit */
  percentage: number | null;
  /** Which limit triggered (tokens or cost), null if neither */
  limitType: "tokens" | "cost" | null;
  /** Human-readable message about the limit status */
  message: string | null;
}

/**
 * Configuration for cost tracking.
 */
export interface CostTrackerConfig {
  /** Model name for pricing lookup */
  model: string;
  /** Maximum total tokens (input + output), undefined = no limit */
  maxTokens?: number;
  /** Maximum cost in USD, undefined = no limit */
  maxCost?: number;
}

/**
 * Snapshot of current cost tracking state.
 */
export interface CostSnapshot {
  /** Token usage breakdown */
  tokens: TokenUsage;
  /** Estimated cost in USD */
  estimatedCost: number;
  /** Model used for pricing */
  model: string;
  /** Limit check result */
  limits: LimitCheckResult;
}

/**
 * Tracks token usage and cost for an agent session.
 */
export class CostTracker {
  private readonly model: string;
  private readonly pricing: ModelPricing;
  private readonly maxTokens?: number;
  private readonly maxCost?: number;

  private inputTokens = 0;
  private outputTokens = 0;

  constructor(config: CostTrackerConfig) {
    this.model = config.model;
    this.pricing = MODEL_PRICING[config.model] ?? DEFAULT_PRICING;
    this.maxTokens = config.maxTokens;
    this.maxCost = config.maxCost;
  }

  /**
   * Add token usage from a turn.
   * @param input - Input tokens used
   * @param output - Output tokens used
   */
  addUsage(input: number, output: number): void {
    this.inputTokens += input;
    this.outputTokens += output;
  }

  /**
   * Get current token usage.
   */
  getTokenUsage(): TokenUsage {
    return {
      input: this.inputTokens,
      output: this.outputTokens,
      total: this.inputTokens + this.outputTokens,
    };
  }

  /**
   * Get estimated cost in USD based on current usage.
   */
  getEstimatedCost(): number {
    const inputCost = (this.inputTokens / 1_000_000) * this.pricing.input;
    const outputCost = (this.outputTokens / 1_000_000) * this.pricing.output;
    return inputCost + outputCost;
  }

  /**
   * Check if any limits have been reached.
   */
  checkLimits(): LimitCheckResult {
    const totalTokens = this.inputTokens + this.outputTokens;
    const estimatedCost = this.getEstimatedCost();

    // Check token limit
    if (this.maxTokens !== undefined) {
      const tokenPercentage = totalTokens / this.maxTokens;

      if (tokenPercentage >= 1.0) {
        return {
          warning: true,
          exceeded: true,
          percentage: tokenPercentage,
          limitType: "tokens",
          message: `Token limit exceeded: ${totalTokens.toLocaleString()} / ${this.maxTokens.toLocaleString()} tokens (${(tokenPercentage * 100).toFixed(0)}%)`,
        };
      }

      if (tokenPercentage >= WARNING_THRESHOLD) {
        return {
          warning: true,
          exceeded: false,
          percentage: tokenPercentage,
          limitType: "tokens",
          message: `Token limit warning: ${totalTokens.toLocaleString()} / ${this.maxTokens.toLocaleString()} tokens (${(tokenPercentage * 100).toFixed(0)}%)`,
        };
      }
    }

    // Check cost limit
    if (this.maxCost !== undefined) {
      const costPercentage = estimatedCost / this.maxCost;

      if (costPercentage >= 1.0) {
        return {
          warning: true,
          exceeded: true,
          percentage: costPercentage,
          limitType: "cost",
          message: `Cost limit exceeded: $${estimatedCost.toFixed(2)} / $${this.maxCost.toFixed(2)} (${(costPercentage * 100).toFixed(0)}%)`,
        };
      }

      if (costPercentage >= WARNING_THRESHOLD) {
        return {
          warning: true,
          exceeded: false,
          percentage: costPercentage,
          limitType: "cost",
          message: `Cost limit warning: $${estimatedCost.toFixed(2)} / $${this.maxCost.toFixed(2)} (${(costPercentage * 100).toFixed(0)}%)`,
        };
      }
    }

    // No limits reached
    return {
      warning: false,
      exceeded: false,
      percentage: null,
      limitType: null,
      message: null,
    };
  }

  /**
   * Get a snapshot of current cost tracking state.
   */
  getSnapshot(): CostSnapshot {
    return {
      tokens: this.getTokenUsage(),
      estimatedCost: this.getEstimatedCost(),
      model: this.model,
      limits: this.checkLimits(),
    };
  }

  /**
   * Format a turn summary line for display.
   * @param turn - Current turn number
   */
  formatTurnSummary(turn: number): string {
    const tokens = this.getTokenUsage();
    const cost = this.getEstimatedCost();
    const limits = this.checkLimits();

    let line = `Turn ${turn} | Tokens: ${tokens.total.toLocaleString()} (in: ${tokens.input.toLocaleString()}, out: ${tokens.output.toLocaleString()}) | Cost: $${cost.toFixed(2)}`;

    if (limits.percentage !== null) {
      const pct = (limits.percentage * 100).toFixed(0);
      if (limits.exceeded) {
        line += ` | Limit: ${pct}% 🛑`;
      } else if (limits.warning) {
        line += ` | Limit: ${pct}% ⚠️`;
      } else {
        line += ` | Limit: ${pct}%`;
      }
    }

    return line;
  }

  /**
   * Format a session summary for display.
   */
  formatSessionSummary(): string {
    const tokens = this.getTokenUsage();
    const cost = this.getEstimatedCost();

    const lines: string[] = [
      `Total tokens: ${tokens.total.toLocaleString()} (input: ${tokens.input.toLocaleString()}, output: ${tokens.output.toLocaleString()})`,
      `Estimated cost: $${cost.toFixed(4)} (model: ${this.model})`,
    ];

    if (this.maxTokens !== undefined) {
      const pct = ((tokens.total / this.maxTokens) * 100).toFixed(1);
      lines.push(`Token limit: ${tokens.total.toLocaleString()} / ${this.maxTokens.toLocaleString()} (${pct}%)`);
    }

    if (this.maxCost !== undefined) {
      const pct = ((cost / this.maxCost) * 100).toFixed(1);
      lines.push(`Cost limit: $${cost.toFixed(2)} / $${this.maxCost.toFixed(2)} (${pct}%)`);
    }

    return lines.join("\n");
  }

  /**
   * Get the pricing being used for this tracker.
   */
  getPricing(): ModelPricing {
    return { ...this.pricing };
  }

  /**
   * Check if this tracker has any limits configured.
   */
  hasLimits(): boolean {
    return this.maxTokens !== undefined || this.maxCost !== undefined;
  }
}

/**
 * Get cost limits from environment variables.
 * @returns Object with maxTokens and maxCost from env vars
 */
export function getCostLimitsFromEnv(): { maxTokens?: number; maxCost?: number } {
  const result: { maxTokens?: number; maxCost?: number } = {};

  const maxTokensEnv = process.env.CHORAGEN_MAX_TOKENS;
  if (maxTokensEnv) {
    const parsed = parseInt(maxTokensEnv, 10);
    if (!isNaN(parsed) && parsed > 0) {
      result.maxTokens = parsed;
    }
  }

  const maxCostEnv = process.env.CHORAGEN_MAX_COST;
  if (maxCostEnv) {
    const parsed = parseFloat(maxCostEnv);
    if (!isNaN(parsed) && parsed > 0) {
      result.maxCost = parsed;
    }
  }

  return result;
}
