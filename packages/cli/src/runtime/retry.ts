// ADR: ADR-010-agent-runtime-architecture

/**
 * Retry logic with exponential backoff for transient errors.
 * Used by the agentic loop for LLM calls and tool execution.
 */

/**
 * HTTP status codes that indicate transient errors worth retrying.
 */
export const RETRYABLE_STATUS_CODES = new Set([
  408, // Request Timeout
  429, // Too Many Requests (rate limit)
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]);

/**
 * Error types that indicate transient errors worth retrying.
 */
export const RETRYABLE_ERROR_TYPES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EPIPE",
  "EHOSTUNREACH",
  "ENETUNREACH",
]);

/**
 * Configuration for retry behavior.
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Base delay in milliseconds (default: 1000) */
  baseDelayMs: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelayMs: number;
  /** Whether retry is enabled (default: true) */
  enabled: boolean;
}

/**
 * Default retry configuration.
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  enabled: true,
};

/**
 * Result of a retry operation.
 */
export interface RetryResult<T> {
  /** The successful result (if any) */
  data?: T;
  /** Whether the operation succeeded */
  success: boolean;
  /** Number of attempts made */
  attempts: number;
  /** The final error (if failed) */
  error?: Error;
  /** Whether the error was retryable */
  wasRetryable: boolean;
}

/**
 * Error with optional status code and error code for retry classification.
 */
export interface RetryableError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  cause?: Error & { code?: string };
}

/**
 * Determine if an error is retryable based on status code or error type.
 *
 * @param error - The error to check
 * @returns True if the error is transient and worth retrying
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const err = error as RetryableError;

  // Check HTTP status codes
  const statusCode = err.status ?? err.statusCode;
  if (statusCode !== undefined && RETRYABLE_STATUS_CODES.has(statusCode)) {
    return true;
  }

  // Check error codes (network errors)
  const errorCode = err.code ?? err.cause?.code;
  if (errorCode !== undefined && RETRYABLE_ERROR_TYPES.has(errorCode)) {
    return true;
  }

  // Check for common transient error messages
  const message = err.message.toLowerCase();
  const transientPatterns = [
    "rate limit",
    "too many requests",
    "timeout",
    "timed out",
    "temporarily unavailable",
    "service unavailable",
    "connection reset",
    "connection refused",
    "network error",
    "socket hang up",
    "econnreset",
    "econnrefused",
    "etimedout",
    "overloaded",
  ];

  return transientPatterns.some((pattern) => message.includes(pattern));
}

/**
 * Calculate delay for a given retry attempt using exponential backoff with jitter.
 *
 * @param attempt - The current attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  config: Pick<RetryConfig, "baseDelayMs" | "maxDelayMs">
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  // Add jitter (±25%) to prevent thundering herd
  const jitterFactor = 0.75 + Math.random() * 0.5;
  const delayWithJitter = Math.floor(cappedDelay * jitterFactor);

  return delayWithJitter;
}

/**
 * Sleep for a specified duration.
 *
 * @param ms - Duration in milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an async operation with retry logic and exponential backoff.
 *
 * Retries on transient errors (network issues, rate limits, 5xx errors).
 * Does NOT retry on permanent errors (4xx except 429).
 *
 * @param operation - The async operation to execute
 * @param config - Optional retry configuration
 * @returns Result with data or error information
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => provider.chat(messages, tools),
 *   { maxRetries: 3, baseDelayMs: 1000 }
 * );
 *
 * if (result.success) {
 *   console.log("Response:", result.data);
 * } else {
 *   console.error("Failed after", result.attempts, "attempts:", result.error);
 * }
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  // If retry is disabled, just run once
  if (!fullConfig.enabled) {
    try {
      const data = await operation();
      return { data, success: true, attempts: 1, wasRetryable: false };
    } catch (error) {
      return {
        success: false,
        attempts: 1,
        error: error instanceof Error ? error : new Error(String(error)),
        wasRetryable: isRetryableError(error),
      };
    }
  }

  let lastError: Error | undefined;
  let wasRetryable = false;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      const data = await operation();
      return { data, success: true, attempts: attempt + 1, wasRetryable: false };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      wasRetryable = isRetryableError(error);

      // Don't retry non-retryable errors
      if (!wasRetryable) {
        console.log(`[Retry] Non-retryable error, not retrying: ${lastError.message}`);
        return {
          success: false,
          attempts: attempt + 1,
          error: lastError,
          wasRetryable: false,
        };
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= fullConfig.maxRetries) {
        console.log(
          `[Retry] Max retries (${fullConfig.maxRetries}) exhausted: ${lastError.message}`
        );
        break;
      }

      // Calculate and apply backoff delay
      const delay = calculateBackoffDelay(attempt, fullConfig);
      console.log(
        `[Retry] Attempt ${attempt + 1}/${fullConfig.maxRetries + 1} failed, ` +
          `retrying in ${delay}ms: ${lastError.message}`
      );
      await sleep(delay);
    }
  }

  return {
    success: false,
    attempts: fullConfig.maxRetries + 1,
    error: lastError,
    wasRetryable,
  };
}

/**
 * Wrap an async function to automatically retry on transient errors.
 *
 * @param fn - The function to wrap
 * @param config - Optional retry configuration
 * @returns A wrapped function that retries on transient errors
 *
 * @example
 * ```typescript
 * const retryableChat = withRetryWrapper(
 *   (messages, tools) => provider.chat(messages, tools),
 *   { maxRetries: 3 }
 * );
 *
 * const response = await retryableChat(messages, tools);
 * ```
 */
export function withRetryWrapper<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  config: Partial<RetryConfig> = {}
): (...args: TArgs) => Promise<RetryResult<TResult>> {
  return (...args: TArgs) => withRetry(() => fn(...args), config);
}
