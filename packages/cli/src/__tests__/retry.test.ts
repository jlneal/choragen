/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify retry logic correctly handles transient errors with exponential backoff"
 * @test-type unit
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  withRetry,
  withRetryWrapper,
  isRetryableError,
  calculateBackoffDelay,
  sleep,
  DEFAULT_RETRY_CONFIG,
  RETRYABLE_STATUS_CODES,
  RETRYABLE_ERROR_TYPES,
  type RetryableError,
} from "../runtime/retry.js";

describe("isRetryableError", () => {
  describe("HTTP status codes", () => {
    it("returns true for 408 Request Timeout", () => {
      const error = new Error("Request Timeout") as RetryableError;
      error.status = 408;
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for 429 Too Many Requests", () => {
      const error = new Error("Rate limited") as RetryableError;
      error.status = 429;
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for 500 Internal Server Error", () => {
      const error = new Error("Server error") as RetryableError;
      error.statusCode = 500;
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for 502 Bad Gateway", () => {
      const error = new Error("Bad gateway") as RetryableError;
      error.status = 502;
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for 503 Service Unavailable", () => {
      const error = new Error("Service unavailable") as RetryableError;
      error.status = 503;
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for 504 Gateway Timeout", () => {
      const error = new Error("Gateway timeout") as RetryableError;
      error.status = 504;
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns false for 400 Bad Request", () => {
      const error = new Error("Bad request") as RetryableError;
      error.status = 400;
      expect(isRetryableError(error)).toBe(false);
    });

    it("returns false for 401 Unauthorized", () => {
      const error = new Error("Unauthorized") as RetryableError;
      error.status = 401;
      expect(isRetryableError(error)).toBe(false);
    });

    it("returns false for 403 Forbidden", () => {
      const error = new Error("Forbidden") as RetryableError;
      error.status = 403;
      expect(isRetryableError(error)).toBe(false);
    });

    it("returns false for 404 Not Found", () => {
      const error = new Error("Not found") as RetryableError;
      error.status = 404;
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe("network error codes", () => {
    it("returns true for ECONNRESET", () => {
      const error = new Error("Connection reset") as RetryableError;
      error.code = "ECONNRESET";
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for ECONNREFUSED", () => {
      const error = new Error("Connection refused") as RetryableError;
      error.code = "ECONNREFUSED";
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for ETIMEDOUT", () => {
      const error = new Error("Timed out") as RetryableError;
      error.code = "ETIMEDOUT";
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for ENOTFOUND", () => {
      const error = new Error("DNS not found") as RetryableError;
      error.code = "ENOTFOUND";
      expect(isRetryableError(error)).toBe(true);
    });

    it("returns true for error code in cause", () => {
      const cause = new Error("Underlying error") as Error & { code?: string };
      cause.code = "ECONNRESET";
      const error = new Error("Wrapper error") as RetryableError;
      error.cause = cause;
      expect(isRetryableError(error)).toBe(true);
    });
  });

  describe("error message patterns", () => {
    it("returns true for rate limit messages", () => {
      expect(isRetryableError(new Error("Rate limit exceeded"))).toBe(true);
      expect(isRetryableError(new Error("Too many requests"))).toBe(true);
    });

    it("returns true for timeout messages", () => {
      expect(isRetryableError(new Error("Request timeout"))).toBe(true);
      expect(isRetryableError(new Error("Connection timed out"))).toBe(true);
    });

    it("returns true for service unavailable messages", () => {
      expect(isRetryableError(new Error("Service temporarily unavailable"))).toBe(true);
      expect(isRetryableError(new Error("Service unavailable"))).toBe(true);
    });

    it("returns true for connection error messages", () => {
      expect(isRetryableError(new Error("Connection reset by peer"))).toBe(true);
      expect(isRetryableError(new Error("Connection refused"))).toBe(true);
      expect(isRetryableError(new Error("Network error occurred"))).toBe(true);
      expect(isRetryableError(new Error("Socket hang up"))).toBe(true);
    });

    it("returns true for overloaded messages", () => {
      expect(isRetryableError(new Error("Server overloaded"))).toBe(true);
    });

    it("returns false for generic errors", () => {
      expect(isRetryableError(new Error("Invalid input"))).toBe(false);
      expect(isRetryableError(new Error("File not found"))).toBe(false);
      expect(isRetryableError(new Error("Permission denied"))).toBe(false);
    });
  });

  describe("non-error values", () => {
    it("returns false for non-Error objects", () => {
      expect(isRetryableError("string error")).toBe(false);
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
      expect(isRetryableError({ message: "fake error" })).toBe(false);
    });
  });
});

describe("calculateBackoffDelay", () => {
  it("returns base delay for first attempt", () => {
    const config = { baseDelayMs: 1000, maxDelayMs: 30000 };
    const delay = calculateBackoffDelay(0, config);
    // With jitter (±25%), delay should be between 750 and 1250
    expect(delay).toBeGreaterThanOrEqual(750);
    expect(delay).toBeLessThanOrEqual(1250);
  });

  it("doubles delay for each subsequent attempt", () => {
    const config = { baseDelayMs: 1000, maxDelayMs: 30000 };

    // Attempt 1: base * 2^1 = 2000 (±25% = 1500-2500)
    const delay1 = calculateBackoffDelay(1, config);
    expect(delay1).toBeGreaterThanOrEqual(1500);
    expect(delay1).toBeLessThanOrEqual(2500);

    // Attempt 2: base * 2^2 = 4000 (±25% = 3000-5000)
    const delay2 = calculateBackoffDelay(2, config);
    expect(delay2).toBeGreaterThanOrEqual(3000);
    expect(delay2).toBeLessThanOrEqual(5000);

    // Attempt 3: base * 2^3 = 8000 (±25% = 6000-10000)
    const delay3 = calculateBackoffDelay(3, config);
    expect(delay3).toBeGreaterThanOrEqual(6000);
    expect(delay3).toBeLessThanOrEqual(10000);
  });

  it("caps delay at maxDelayMs", () => {
    const config = { baseDelayMs: 1000, maxDelayMs: 5000 };
    // Attempt 10: base * 2^10 = 1024000, but capped at 5000
    const delay = calculateBackoffDelay(10, config);
    // With jitter (±25%), delay should be between 3750 and 6250, but capped
    expect(delay).toBeLessThanOrEqual(6250);
    expect(delay).toBeGreaterThanOrEqual(3750);
  });

  it("adds jitter to prevent thundering herd", () => {
    const config = { baseDelayMs: 1000, maxDelayMs: 30000 };
    const delays = new Set<number>();

    // Generate multiple delays and check they're not all identical
    const SAMPLE_COUNT = 10;
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      delays.add(calculateBackoffDelay(0, config));
    }

    // With jitter, we should get multiple different values
    expect(delays.size).toBeGreaterThan(1);
  });
});

describe("sleep", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves after specified duration", async () => {
    const SLEEP_DURATION_MS = 1000;
    const sleepPromise = sleep(SLEEP_DURATION_MS);

    // Advance timers
    vi.advanceTimersByTime(SLEEP_DURATION_MS);

    await expect(sleepPromise).resolves.toBeUndefined();
  });

  it("does not resolve before duration", async () => {
    const SLEEP_DURATION_MS = 1000;
    let resolved = false;
    sleep(SLEEP_DURATION_MS).then(() => {
      resolved = true;
    });

    // Advance less than duration
    const PARTIAL_ADVANCE_MS = 500;
    vi.advanceTimersByTime(PARTIAL_ADVANCE_MS);
    expect(resolved).toBe(false);

    // Advance remaining time
    vi.advanceTimersByTime(SLEEP_DURATION_MS - PARTIAL_ADVANCE_MS);
    await Promise.resolve(); // Let promise resolve
    expect(resolved).toBe(true);
  });
});

describe("withRetry", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("successful operations", () => {
    it("returns success on first attempt", async () => {
      const operation = vi.fn().mockResolvedValue("success");

      const resultPromise = withRetry(operation);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.data).toBe("success");
      expect(result.attempts).toBe(1);
      expect(result.wasRetryable).toBe(false);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("returns success after retries", async () => {
      const error = new Error("Rate limit") as RetryableError;
      error.status = 429;

      const operation = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue("success");

      const resultPromise = withRetry(operation, { maxRetries: 3, baseDelayMs: 100 });
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.data).toBe("success");
      expect(result.attempts).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe("non-retryable errors", () => {
    it("does not retry on 400 Bad Request", async () => {
      const error = new Error("Bad request") as RetryableError;
      error.status = 400;

      const operation = vi.fn().mockRejectedValue(error);

      const resultPromise = withRetry(operation);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(result.wasRetryable).toBe(false);
      expect(result.error?.message).toBe("Bad request");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("does not retry on 404 Not Found", async () => {
      const error = new Error("Not found") as RetryableError;
      error.status = 404;

      const operation = vi.fn().mockRejectedValue(error);

      const resultPromise = withRetry(operation);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(result.wasRetryable).toBe(false);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("does not retry on generic errors", async () => {
      const error = new Error("Invalid input");

      const operation = vi.fn().mockRejectedValue(error);

      const resultPromise = withRetry(operation);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(result.wasRetryable).toBe(false);
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe("retryable errors", () => {
    it("retries on 429 Too Many Requests", async () => {
      const error = new Error("Rate limited") as RetryableError;
      error.status = 429;

      const operation = vi.fn().mockRejectedValue(error);

      const resultPromise = withRetry(operation, { maxRetries: 2, baseDelayMs: 100 });
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3); // Initial + 2 retries
      expect(result.wasRetryable).toBe(true);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it("retries on 500 Internal Server Error", async () => {
      const error = new Error("Server error") as RetryableError;
      error.status = 500;

      const operation = vi.fn().mockRejectedValue(error);

      const resultPromise = withRetry(operation, { maxRetries: 1, baseDelayMs: 100 });
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(2); // Initial + 1 retry
      expect(result.wasRetryable).toBe(true);
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("retries on network errors", async () => {
      const error = new Error("Connection reset") as RetryableError;
      error.code = "ECONNRESET";

      const operation = vi.fn().mockRejectedValue(error);

      const resultPromise = withRetry(operation, { maxRetries: 2, baseDelayMs: 100 });
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3);
      expect(result.wasRetryable).toBe(true);
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe("configuration", () => {
    it("respects maxRetries setting", async () => {
      const error = new Error("Rate limited") as RetryableError;
      error.status = 429;

      const operation = vi.fn().mockRejectedValue(error);
      const MAX_RETRIES = 5;

      const resultPromise = withRetry(operation, { maxRetries: MAX_RETRIES, baseDelayMs: 100 });
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.attempts).toBe(MAX_RETRIES + 1);
      expect(operation).toHaveBeenCalledTimes(MAX_RETRIES + 1);
    });

    it("uses default config when not specified", async () => {
      const error = new Error("Rate limited") as RetryableError;
      error.status = 429;

      const operation = vi.fn().mockRejectedValue(error);

      const resultPromise = withRetry(operation);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.attempts).toBe(DEFAULT_RETRY_CONFIG.maxRetries + 1);
    });

    it("disables retry when enabled is false", async () => {
      const error = new Error("Rate limited") as RetryableError;
      error.status = 429;

      const operation = vi.fn().mockRejectedValue(error);

      const resultPromise = withRetry(operation, { enabled: false });
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(result.wasRetryable).toBe(true); // Still classified as retryable
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe("backoff timing", () => {
    it("applies exponential backoff between retries", async () => {
      const error = new Error("Rate limited") as RetryableError;
      error.status = 429;

      const operation = vi.fn().mockRejectedValue(error);
      const baseDelayMs = 1000;

      const resultPromise = withRetry(operation, {
        maxRetries: 3,
        baseDelayMs,
        maxDelayMs: 30000,
      });

      // First attempt fails immediately
      await vi.advanceTimersByTimeAsync(0);
      expect(operation).toHaveBeenCalledTimes(1);

      // Wait for first backoff (base * 2^0 = 1000ms ± jitter)
      await vi.advanceTimersByTimeAsync(1500);
      expect(operation).toHaveBeenCalledTimes(2);

      // Wait for second backoff (base * 2^1 = 2000ms ± jitter)
      await vi.advanceTimersByTimeAsync(3000);
      expect(operation).toHaveBeenCalledTimes(3);

      // Wait for third backoff (base * 2^2 = 4000ms ± jitter)
      await vi.advanceTimersByTimeAsync(6000);
      expect(operation).toHaveBeenCalledTimes(4);

      await resultPromise;
    });
  });

  describe("error handling", () => {
    it("converts non-Error throws to Error", async () => {
      const operation = vi.fn().mockRejectedValue("string error");

      const resultPromise = withRetry(operation, { enabled: false });
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe("string error");
    });
  });
});

describe("withRetryWrapper", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("wraps a function with retry logic", async () => {
    const fn = vi.fn().mockResolvedValue("result");
    const wrapped = withRetryWrapper(fn);

    const resultPromise = wrapped("arg1", "arg2");
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.success).toBe(true);
    expect(result.data).toBe("result");
    expect(fn).toHaveBeenCalledWith("arg1", "arg2");
  });

  it("passes config to withRetry", async () => {
    const error = new Error("Rate limited") as RetryableError;
    error.status = 429;

    const fn = vi.fn().mockRejectedValue(error);
    const MAX_RETRIES = 2;
    const wrapped = withRetryWrapper(fn, { maxRetries: MAX_RETRIES, baseDelayMs: 100 });

    const resultPromise = wrapped();
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.attempts).toBe(MAX_RETRIES + 1);
  });
});

describe("constants", () => {
  it("DEFAULT_RETRY_CONFIG has expected values", () => {
    expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3);
    expect(DEFAULT_RETRY_CONFIG.baseDelayMs).toBe(1000);
    expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBe(30000);
    expect(DEFAULT_RETRY_CONFIG.enabled).toBe(true);
  });

  it("RETRYABLE_STATUS_CODES contains expected codes", () => {
    expect(RETRYABLE_STATUS_CODES.has(408)).toBe(true);
    expect(RETRYABLE_STATUS_CODES.has(429)).toBe(true);
    expect(RETRYABLE_STATUS_CODES.has(500)).toBe(true);
    expect(RETRYABLE_STATUS_CODES.has(502)).toBe(true);
    expect(RETRYABLE_STATUS_CODES.has(503)).toBe(true);
    expect(RETRYABLE_STATUS_CODES.has(504)).toBe(true);
    expect(RETRYABLE_STATUS_CODES.has(400)).toBe(false);
    expect(RETRYABLE_STATUS_CODES.has(404)).toBe(false);
  });

  it("RETRYABLE_ERROR_TYPES contains expected types", () => {
    expect(RETRYABLE_ERROR_TYPES.has("ECONNRESET")).toBe(true);
    expect(RETRYABLE_ERROR_TYPES.has("ECONNREFUSED")).toBe(true);
    expect(RETRYABLE_ERROR_TYPES.has("ETIMEDOUT")).toBe(true);
    expect(RETRYABLE_ERROR_TYPES.has("ENOTFOUND")).toBe(true);
    expect(RETRYABLE_ERROR_TYPES.has("EAI_AGAIN")).toBe(true);
    expect(RETRYABLE_ERROR_TYPES.has("EPIPE")).toBe(true);
    expect(RETRYABLE_ERROR_TYPES.has("ENOENT")).toBe(false);
  });
});
