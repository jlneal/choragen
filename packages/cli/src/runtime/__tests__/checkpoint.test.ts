/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Unit tests for human-in-the-loop checkpoint system"
 * @test-type unit
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  CheckpointHandler,
  SENSITIVE_ACTIONS,
  createCheckpointHandler,
  getApprovalTimeoutFromEnv,
  DEFAULT_APPROVAL_TIMEOUT,
} from "../checkpoint.js";

/** Short timeout for testing (100ms) */
const SHORT_TIMEOUT_MS = 100;

describe("CheckpointHandler", () => {
  describe("SENSITIVE_ACTIONS", () => {
    it("should include write_file", () => {
      expect(SENSITIVE_ACTIONS.has("write_file")).toBe(true);
    });

    it("should include task_complete", () => {
      expect(SENSITIVE_ACTIONS.has("task_complete")).toBe(true);
    });

    it("should include chain_close", () => {
      expect(SENSITIVE_ACTIONS.has("chain_close")).toBe(true);
    });

    it("should include spawn_session", () => {
      expect(SENSITIVE_ACTIONS.has("spawn_session")).toBe(true);
    });

    it("should not include non-sensitive actions", () => {
      expect(SENSITIVE_ACTIONS.has("read_file")).toBe(false);
      expect(SENSITIVE_ACTIONS.has("chain:status")).toBe(false);
    });
  });

  describe("requiresApproval", () => {
    it("should return false when requireApproval is disabled", () => {
      const handler = new CheckpointHandler({ requireApproval: false });
      expect(handler.requiresApproval("task_complete", {})).toBe(false);
    });

    it("should return false when autoApprove is enabled", () => {
      const handler = new CheckpointHandler({
        requireApproval: true,
        autoApprove: true,
      });
      expect(handler.requiresApproval("task_complete", {})).toBe(false);
    });

    it("should return false for non-sensitive actions", () => {
      const handler = new CheckpointHandler({ requireApproval: true });
      expect(handler.requiresApproval("read_file", {})).toBe(false);
      expect(handler.requiresApproval("chain:status", {})).toBe(false);
    });

    it("should return true for sensitive actions when approval is required", () => {
      const handler = new CheckpointHandler({ requireApproval: true });
      expect(handler.requiresApproval("task_complete", {})).toBe(true);
      expect(handler.requiresApproval("chain_close", {})).toBe(true);
      expect(handler.requiresApproval("spawn_session", {})).toBe(true);
    });

    it("should return true for write_file only when content is empty (delete)", () => {
      const handler = new CheckpointHandler({ requireApproval: true });
      
      // Delete operation (empty content) requires approval
      expect(handler.requiresApproval("write_file", { content: "" })).toBe(true);
      expect(handler.requiresApproval("write_file", { content: "   " })).toBe(true);
      expect(handler.requiresApproval("write_file", {})).toBe(true);
      
      // Write operation with content does not require approval
      expect(handler.requiresApproval("write_file", { content: "some content" })).toBe(false);
    });
  });

  describe("requestApproval with autoApprove", () => {
    it("should auto-approve when autoApprove is enabled", async () => {
      const handler = new CheckpointHandler({
        requireApproval: true,
        autoApprove: true,
      });

      const result = await handler.requestApproval("task_complete", {});
      expect(result.approved).toBe(true);
    });
  });

  describe("paused state", () => {
    it("should start not paused", () => {
      const handler = new CheckpointHandler();
      expect(handler.paused).toBe(false);
    });

    it("should allow resuming", () => {
      const handler = new CheckpointHandler();
      // Manually set paused state for testing
      (handler as unknown as { isPaused: boolean }).isPaused = true;
      expect(handler.paused).toBe(true);
      
      handler.resume();
      expect(handler.paused).toBe(false);
    });
  });

  describe("rejection callback", () => {
    it("should accept a rejection callback in constructor", () => {
      const onRejection = vi.fn();
      const handler = new CheckpointHandler(
        {
          requireApproval: true,
          autoApprove: false,
          approvalTimeoutMs: SHORT_TIMEOUT_MS,
        },
        onRejection
      );
      
      // Verify handler was created with callback
      expect(handler).toBeInstanceOf(CheckpointHandler);
      expect(handler.requiresApproval("task_complete", {})).toBe(true);
    });
  });

  describe("config defaults", () => {
    it("should use default timeout when not specified", () => {
      const handler = new CheckpointHandler({
        requireApproval: true,
      });
      
      // Handler should be created with defaults
      expect(handler).toBeInstanceOf(CheckpointHandler);
    });

    it("should accept custom session ID", () => {
      const handler = new CheckpointHandler({
        requireApproval: true,
        sessionId: "test-session-123",
      });
      
      expect(handler).toBeInstanceOf(CheckpointHandler);
    });
  });
});

describe("createCheckpointHandler", () => {
  it("should create a handler with default config", () => {
    const handler = createCheckpointHandler();
    expect(handler).toBeInstanceOf(CheckpointHandler);
    expect(handler.requiresApproval("task_complete", {})).toBe(false);
  });

  it("should create a handler with custom config", () => {
    const handler = createCheckpointHandler({ requireApproval: true });
    expect(handler.requiresApproval("task_complete", {})).toBe(true);
  });

  it("should accept a rejection callback", () => {
    const onRejection = vi.fn();
    const handler = createCheckpointHandler({}, onRejection);
    expect(handler).toBeInstanceOf(CheckpointHandler);
  });
});

describe("getApprovalTimeoutFromEnv", () => {
  const originalEnv = process.env.CHORAGEN_APPROVAL_TIMEOUT;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.CHORAGEN_APPROVAL_TIMEOUT;
    } else {
      process.env.CHORAGEN_APPROVAL_TIMEOUT = originalEnv;
    }
  });

  it("should return default timeout when env var is not set", () => {
    delete process.env.CHORAGEN_APPROVAL_TIMEOUT;
    expect(getApprovalTimeoutFromEnv()).toBe(DEFAULT_APPROVAL_TIMEOUT);
  });

  it("should parse seconds and convert to milliseconds when value < 1000", () => {
    process.env.CHORAGEN_APPROVAL_TIMEOUT = "120";
    const EXPECTED_TIMEOUT_MS = 120000;
    expect(getApprovalTimeoutFromEnv()).toBe(EXPECTED_TIMEOUT_MS);
  });

  it("should treat values >= 1000 as milliseconds", () => {
    process.env.CHORAGEN_APPROVAL_TIMEOUT = "60000";
    const EXPECTED_TIMEOUT_MS = 60000;
    expect(getApprovalTimeoutFromEnv()).toBe(EXPECTED_TIMEOUT_MS);
  });

  it("should return default for invalid values", () => {
    process.env.CHORAGEN_APPROVAL_TIMEOUT = "invalid";
    expect(getApprovalTimeoutFromEnv()).toBe(DEFAULT_APPROVAL_TIMEOUT);

    process.env.CHORAGEN_APPROVAL_TIMEOUT = "-100";
    expect(getApprovalTimeoutFromEnv()).toBe(DEFAULT_APPROVAL_TIMEOUT);

    process.env.CHORAGEN_APPROVAL_TIMEOUT = "0";
    expect(getApprovalTimeoutFromEnv()).toBe(DEFAULT_APPROVAL_TIMEOUT);
  });
});

describe("DEFAULT_APPROVAL_TIMEOUT", () => {
  it("should be 5 minutes in milliseconds", () => {
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    expect(DEFAULT_APPROVAL_TIMEOUT).toBe(FIVE_MINUTES_MS);
  });
});
