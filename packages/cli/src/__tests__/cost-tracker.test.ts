/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify cost tracking correctly tracks tokens, estimates cost, and enforces limits"
 * @test-type unit
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CostTracker,
  MODEL_PRICING,
  DEFAULT_PRICING,
  getCostLimitsFromEnv,
} from "../runtime/cost-tracker.js";

describe("CostTracker", () => {
  describe("constructor", () => {
    it("uses model-specific pricing when available", () => {
      const tracker = new CostTracker({ model: "gpt-4o" });
      const pricing = tracker.getPricing();

      expect(pricing.input).toBe(MODEL_PRICING["gpt-4o"].input);
      expect(pricing.output).toBe(MODEL_PRICING["gpt-4o"].output);
    });

    it("uses default pricing for unknown models", () => {
      const tracker = new CostTracker({ model: "unknown-model-xyz" });
      const pricing = tracker.getPricing();

      expect(pricing.input).toBe(DEFAULT_PRICING.input);
      expect(pricing.output).toBe(DEFAULT_PRICING.output);
    });

    it("stores maxTokens and maxCost limits", () => {
      const MAX_TOKENS = 100000;
      const MAX_COST = 5.0;
      const tracker = new CostTracker({
        model: "gpt-4o",
        maxTokens: MAX_TOKENS,
        maxCost: MAX_COST,
      });

      expect(tracker.hasLimits()).toBe(true);
    });

    it("reports no limits when none configured", () => {
      const tracker = new CostTracker({ model: "gpt-4o" });

      expect(tracker.hasLimits()).toBe(false);
    });
  });

  describe("addUsage", () => {
    it("accumulates token usage across multiple calls", () => {
      const tracker = new CostTracker({ model: "gpt-4o" });

      const FIRST_INPUT = 100;
      const FIRST_OUTPUT = 50;
      tracker.addUsage(FIRST_INPUT, FIRST_OUTPUT);

      const SECOND_INPUT = 200;
      const SECOND_OUTPUT = 100;
      tracker.addUsage(SECOND_INPUT, SECOND_OUTPUT);

      const usage = tracker.getTokenUsage();
      expect(usage.input).toBe(FIRST_INPUT + SECOND_INPUT);
      expect(usage.output).toBe(FIRST_OUTPUT + SECOND_OUTPUT);
      expect(usage.total).toBe(FIRST_INPUT + FIRST_OUTPUT + SECOND_INPUT + SECOND_OUTPUT);
    });
  });

  describe("getTokenUsage", () => {
    it("returns zero usage initially", () => {
      const tracker = new CostTracker({ model: "gpt-4o" });
      const usage = tracker.getTokenUsage();

      expect(usage.input).toBe(0);
      expect(usage.output).toBe(0);
      expect(usage.total).toBe(0);
    });

    it("returns correct breakdown after usage", () => {
      const tracker = new CostTracker({ model: "gpt-4o" });
      const INPUT_TOKENS = 1000;
      const OUTPUT_TOKENS = 500;
      tracker.addUsage(INPUT_TOKENS, OUTPUT_TOKENS);

      const usage = tracker.getTokenUsage();
      expect(usage.input).toBe(INPUT_TOKENS);
      expect(usage.output).toBe(OUTPUT_TOKENS);
      expect(usage.total).toBe(INPUT_TOKENS + OUTPUT_TOKENS);
    });
  });

  describe("getEstimatedCost", () => {
    it("returns zero cost initially", () => {
      const tracker = new CostTracker({ model: "gpt-4o" });

      expect(tracker.getEstimatedCost()).toBe(0);
    });

    it("calculates cost correctly for gpt-4o", () => {
      const tracker = new CostTracker({ model: "gpt-4o" });
      // gpt-4o: $2.50/1M input, $10.00/1M output
      const INPUT_TOKENS = 1_000_000;
      const OUTPUT_TOKENS = 1_000_000;
      tracker.addUsage(INPUT_TOKENS, OUTPUT_TOKENS);

      const cost = tracker.getEstimatedCost();
      const EXPECTED_COST = 2.5 + 10.0;
      expect(cost).toBeCloseTo(EXPECTED_COST);
    });

    it("calculates cost correctly for claude-sonnet-4", () => {
      const tracker = new CostTracker({ model: "claude-sonnet-4-20250514" });
      // claude-sonnet-4: $3.00/1M input, $15.00/1M output
      const INPUT_TOKENS = 500_000;
      const OUTPUT_TOKENS = 100_000;
      tracker.addUsage(INPUT_TOKENS, OUTPUT_TOKENS);

      const cost = tracker.getEstimatedCost();
      // (500000/1M * 3.00) + (100000/1M * 15.00) = 1.50 + 1.50 = 3.00
      const EXPECTED_COST = 3.0;
      expect(cost).toBeCloseTo(EXPECTED_COST);
    });

    it("calculates cost correctly for small token counts", () => {
      const tracker = new CostTracker({ model: "gpt-4o" });
      // gpt-4o: $2.50/1M input, $10.00/1M output
      const INPUT_TOKENS = 10_000;
      const OUTPUT_TOKENS = 5_000;
      tracker.addUsage(INPUT_TOKENS, OUTPUT_TOKENS);

      const cost = tracker.getEstimatedCost();
      // (10000/1M * 2.50) + (5000/1M * 10.00) = 0.025 + 0.05 = 0.075
      const EXPECTED_COST = 0.075;
      expect(cost).toBeCloseTo(EXPECTED_COST);
    });
  });

  describe("checkLimits", () => {
    describe("with no limits", () => {
      it("returns no warning or exceeded", () => {
        const tracker = new CostTracker({ model: "gpt-4o" });
        tracker.addUsage(1_000_000, 1_000_000);

        const result = tracker.checkLimits();
        expect(result.warning).toBe(false);
        expect(result.exceeded).toBe(false);
        expect(result.percentage).toBeNull();
        expect(result.limitType).toBeNull();
        expect(result.message).toBeNull();
      });
    });

    describe("with token limit", () => {
      it("returns no warning below 80%", () => {
        const MAX_TOKENS = 10_000;
        const tracker = new CostTracker({ model: "gpt-4o", maxTokens: MAX_TOKENS });
        const TOKENS_BELOW_WARNING = 7_000; // 70%
        tracker.addUsage(TOKENS_BELOW_WARNING, 0);

        const result = tracker.checkLimits();
        expect(result.warning).toBe(false);
        expect(result.exceeded).toBe(false);
      });

      it("returns warning at 80%", () => {
        const MAX_TOKENS = 10_000;
        const tracker = new CostTracker({ model: "gpt-4o", maxTokens: MAX_TOKENS });
        const TOKENS_AT_WARNING = 8_000; // 80%
        tracker.addUsage(TOKENS_AT_WARNING, 0);

        const result = tracker.checkLimits();
        expect(result.warning).toBe(true);
        expect(result.exceeded).toBe(false);
        expect(result.limitType).toBe("tokens");
        expect(result.percentage).toBeCloseTo(0.8);
        expect(result.message).toContain("Token limit warning");
      });

      it("returns exceeded at 100%", () => {
        const MAX_TOKENS = 10_000;
        const tracker = new CostTracker({ model: "gpt-4o", maxTokens: MAX_TOKENS });
        const TOKENS_AT_LIMIT = 10_000; // 100%
        tracker.addUsage(TOKENS_AT_LIMIT, 0);

        const result = tracker.checkLimits();
        expect(result.warning).toBe(true);
        expect(result.exceeded).toBe(true);
        expect(result.limitType).toBe("tokens");
        expect(result.percentage).toBeCloseTo(1.0);
        expect(result.message).toContain("Token limit exceeded");
      });

      it("returns exceeded above 100%", () => {
        const MAX_TOKENS = 10_000;
        const tracker = new CostTracker({ model: "gpt-4o", maxTokens: MAX_TOKENS });
        const TOKENS_OVER_LIMIT = 12_000; // 120%
        tracker.addUsage(TOKENS_OVER_LIMIT, 0);

        const result = tracker.checkLimits();
        expect(result.warning).toBe(true);
        expect(result.exceeded).toBe(true);
        expect(result.percentage).toBeCloseTo(1.2);
      });
    });

    describe("with cost limit", () => {
      it("returns no warning below 80%", () => {
        const MAX_COST = 1.0;
        const tracker = new CostTracker({ model: "gpt-4o", maxCost: MAX_COST });
        // gpt-4o: $2.50/1M input - need ~280k tokens for $0.70 (70%)
        const TOKENS_FOR_70_PERCENT = 280_000;
        tracker.addUsage(TOKENS_FOR_70_PERCENT, 0);

        const result = tracker.checkLimits();
        expect(result.warning).toBe(false);
        expect(result.exceeded).toBe(false);
      });

      it("returns warning at 80%", () => {
        const MAX_COST = 1.0;
        const tracker = new CostTracker({ model: "gpt-4o", maxCost: MAX_COST });
        // gpt-4o: $2.50/1M input - need 320k tokens for $0.80 (80%)
        const TOKENS_FOR_80_PERCENT = 320_000;
        tracker.addUsage(TOKENS_FOR_80_PERCENT, 0);

        const result = tracker.checkLimits();
        expect(result.warning).toBe(true);
        expect(result.exceeded).toBe(false);
        expect(result.limitType).toBe("cost");
        expect(result.message).toContain("Cost limit warning");
      });

      it("returns exceeded at 100%", () => {
        const MAX_COST = 1.0;
        const tracker = new CostTracker({ model: "gpt-4o", maxCost: MAX_COST });
        // gpt-4o: $2.50/1M input - need 400k tokens for $1.00 (100%)
        const TOKENS_FOR_100_PERCENT = 400_000;
        tracker.addUsage(TOKENS_FOR_100_PERCENT, 0);

        const result = tracker.checkLimits();
        expect(result.warning).toBe(true);
        expect(result.exceeded).toBe(true);
        expect(result.limitType).toBe("cost");
        expect(result.message).toContain("Cost limit exceeded");
      });
    });

    describe("with both limits", () => {
      it("token limit takes precedence when hit first", () => {
        const MAX_TOKENS = 1_000;
        const MAX_COST = 100.0; // Very high, won't be hit
        const tracker = new CostTracker({ model: "gpt-4o", maxTokens: MAX_TOKENS, maxCost: MAX_COST });
        const TOKENS_AT_LIMIT = 1_000;
        tracker.addUsage(TOKENS_AT_LIMIT, 0);

        const result = tracker.checkLimits();
        expect(result.exceeded).toBe(true);
        expect(result.limitType).toBe("tokens");
      });
    });
  });

  describe("getSnapshot", () => {
    it("returns complete state snapshot", () => {
      const MAX_TOKENS = 10_000;
      const tracker = new CostTracker({ model: "gpt-4o", maxTokens: MAX_TOKENS });
      const INPUT_TOKENS = 5_000;
      const OUTPUT_TOKENS = 2_000;
      tracker.addUsage(INPUT_TOKENS, OUTPUT_TOKENS);

      const snapshot = tracker.getSnapshot();

      expect(snapshot.tokens.input).toBe(INPUT_TOKENS);
      expect(snapshot.tokens.output).toBe(OUTPUT_TOKENS);
      expect(snapshot.tokens.total).toBe(INPUT_TOKENS + OUTPUT_TOKENS);
      expect(snapshot.model).toBe("gpt-4o");
      expect(snapshot.estimatedCost).toBeGreaterThan(0);
      expect(snapshot.limits).toBeDefined();
    });
  });

  describe("formatTurnSummary", () => {
    it("formats basic turn info", () => {
      const tracker = new CostTracker({ model: "gpt-4o" });
      const INPUT_TOKENS = 1_000;
      const OUTPUT_TOKENS = 500;
      tracker.addUsage(INPUT_TOKENS, OUTPUT_TOKENS);

      const TURN_NUMBER = 5;
      const summary = tracker.formatTurnSummary(TURN_NUMBER);

      expect(summary).toContain("Turn 5");
      expect(summary).toContain("1,500");
      expect(summary).toContain("1,000");
      expect(summary).toContain("500");
      expect(summary).toContain("$");
    });

    it("includes warning indicator at 80%", () => {
      const MAX_TOKENS = 10_000;
      const tracker = new CostTracker({ model: "gpt-4o", maxTokens: MAX_TOKENS });
      const TOKENS_AT_WARNING = 8_500;
      tracker.addUsage(TOKENS_AT_WARNING, 0);

      const TURN_NUMBER = 3;
      const summary = tracker.formatTurnSummary(TURN_NUMBER);

      expect(summary).toContain("⚠️");
      expect(summary).toContain("85%");
    });

    it("includes stop indicator at 100%", () => {
      const MAX_TOKENS = 10_000;
      const tracker = new CostTracker({ model: "gpt-4o", maxTokens: MAX_TOKENS });
      const TOKENS_AT_LIMIT = 10_000;
      tracker.addUsage(TOKENS_AT_LIMIT, 0);

      const TURN_NUMBER = 3;
      const summary = tracker.formatTurnSummary(TURN_NUMBER);

      expect(summary).toContain("🛑");
      expect(summary).toContain("100%");
    });
  });

  describe("formatSessionSummary", () => {
    it("formats session summary without limits", () => {
      const tracker = new CostTracker({ model: "gpt-4o" });
      const INPUT_TOKENS = 10_000;
      const OUTPUT_TOKENS = 5_000;
      tracker.addUsage(INPUT_TOKENS, OUTPUT_TOKENS);

      const summary = tracker.formatSessionSummary();

      expect(summary).toContain("Total tokens:");
      expect(summary).toContain("15,000");
      expect(summary).toContain("Estimated cost:");
      expect(summary).toContain("gpt-4o");
    });

    it("formats session summary with token limit", () => {
      const MAX_TOKENS = 100_000;
      const tracker = new CostTracker({ model: "gpt-4o", maxTokens: MAX_TOKENS });
      const INPUT_TOKENS = 10_000;
      const OUTPUT_TOKENS = 5_000;
      tracker.addUsage(INPUT_TOKENS, OUTPUT_TOKENS);

      const summary = tracker.formatSessionSummary();

      expect(summary).toContain("Token limit:");
      expect(summary).toContain("100,000");
    });

    it("formats session summary with cost limit", () => {
      const MAX_COST = 5.0;
      const tracker = new CostTracker({ model: "gpt-4o", maxCost: MAX_COST });
      const INPUT_TOKENS = 10_000;
      const OUTPUT_TOKENS = 5_000;
      tracker.addUsage(INPUT_TOKENS, OUTPUT_TOKENS);

      const summary = tracker.formatSessionSummary();

      expect(summary).toContain("Cost limit:");
      expect(summary).toContain("$5.00");
    });
  });

  describe("hasLimits", () => {
    it("returns false when no limits set", () => {
      const tracker = new CostTracker({ model: "gpt-4o" });
      expect(tracker.hasLimits()).toBe(false);
    });

    it("returns true when maxTokens set", () => {
      const MAX_TOKENS = 10_000;
      const tracker = new CostTracker({ model: "gpt-4o", maxTokens: MAX_TOKENS });
      expect(tracker.hasLimits()).toBe(true);
    });

    it("returns true when maxCost set", () => {
      const MAX_COST = 5.0;
      const tracker = new CostTracker({ model: "gpt-4o", maxCost: MAX_COST });
      expect(tracker.hasLimits()).toBe(true);
    });

    it("returns true when both limits set", () => {
      const MAX_TOKENS = 10_000;
      const MAX_COST = 5.0;
      const tracker = new CostTracker({ model: "gpt-4o", maxTokens: MAX_TOKENS, maxCost: MAX_COST });
      expect(tracker.hasLimits()).toBe(true);
    });
  });
});

describe("getCostLimitsFromEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns empty object when no env vars set", () => {
    delete process.env.CHORAGEN_MAX_TOKENS;
    delete process.env.CHORAGEN_MAX_COST;

    const limits = getCostLimitsFromEnv();

    expect(limits.maxTokens).toBeUndefined();
    expect(limits.maxCost).toBeUndefined();
  });

  it("parses CHORAGEN_MAX_TOKENS", () => {
    process.env.CHORAGEN_MAX_TOKENS = "50000";

    const limits = getCostLimitsFromEnv();

    const EXPECTED_TOKENS = 50000;
    expect(limits.maxTokens).toBe(EXPECTED_TOKENS);
  });

  it("parses CHORAGEN_MAX_COST", () => {
    process.env.CHORAGEN_MAX_COST = "2.50";

    const limits = getCostLimitsFromEnv();

    const EXPECTED_COST = 2.5;
    expect(limits.maxCost).toBe(EXPECTED_COST);
  });

  it("parses both env vars", () => {
    process.env.CHORAGEN_MAX_TOKENS = "100000";
    process.env.CHORAGEN_MAX_COST = "10.00";

    const limits = getCostLimitsFromEnv();

    const EXPECTED_TOKENS = 100000;
    const EXPECTED_COST = 10.0;
    expect(limits.maxTokens).toBe(EXPECTED_TOKENS);
    expect(limits.maxCost).toBe(EXPECTED_COST);
  });

  it("ignores invalid CHORAGEN_MAX_TOKENS", () => {
    process.env.CHORAGEN_MAX_TOKENS = "not-a-number";

    const limits = getCostLimitsFromEnv();

    expect(limits.maxTokens).toBeUndefined();
  });

  it("ignores invalid CHORAGEN_MAX_COST", () => {
    process.env.CHORAGEN_MAX_COST = "invalid";

    const limits = getCostLimitsFromEnv();

    expect(limits.maxCost).toBeUndefined();
  });

  it("ignores zero or negative CHORAGEN_MAX_TOKENS", () => {
    process.env.CHORAGEN_MAX_TOKENS = "0";

    const limits = getCostLimitsFromEnv();

    expect(limits.maxTokens).toBeUndefined();

    process.env.CHORAGEN_MAX_TOKENS = "-100";
    const limits2 = getCostLimitsFromEnv();

    expect(limits2.maxTokens).toBeUndefined();
  });

  it("ignores zero or negative CHORAGEN_MAX_COST", () => {
    process.env.CHORAGEN_MAX_COST = "0";

    const limits = getCostLimitsFromEnv();

    expect(limits.maxCost).toBeUndefined();

    process.env.CHORAGEN_MAX_COST = "-5.00";
    const limits2 = getCostLimitsFromEnv();

    expect(limits2.maxCost).toBeUndefined();
  });
});

describe("MODEL_PRICING", () => {
  it("contains expected Anthropic models", () => {
    expect(MODEL_PRICING["claude-sonnet-4-20250514"]).toBeDefined();
    expect(MODEL_PRICING["claude-3-5-sonnet-20241022"]).toBeDefined();
    expect(MODEL_PRICING["claude-3-5-haiku-20241022"]).toBeDefined();
  });

  it("contains expected OpenAI models", () => {
    expect(MODEL_PRICING["gpt-4o"]).toBeDefined();
    expect(MODEL_PRICING["gpt-4o-mini"]).toBeDefined();
  });

  it("contains expected Gemini models", () => {
    expect(MODEL_PRICING["gemini-2.0-flash"]).toBeDefined();
    expect(MODEL_PRICING["gemini-1.5-pro"]).toBeDefined();
    expect(MODEL_PRICING["gemini-1.5-flash"]).toBeDefined();
  });

  it("all pricing entries have input and output costs", () => {
    for (const pricing of Object.values(MODEL_PRICING)) {
      expect(pricing.input).toBeGreaterThan(0);
      expect(pricing.output).toBeGreaterThan(0);
      // Output typically costs more than input
      expect(pricing.output).toBeGreaterThanOrEqual(pricing.input);
    }
  });
});

describe("DEFAULT_PRICING", () => {
  it("has reasonable default values", () => {
    expect(DEFAULT_PRICING.input).toBeGreaterThan(0);
    expect(DEFAULT_PRICING.output).toBeGreaterThan(0);
    expect(DEFAULT_PRICING.output).toBeGreaterThanOrEqual(DEFAULT_PRICING.input);
  });
});
