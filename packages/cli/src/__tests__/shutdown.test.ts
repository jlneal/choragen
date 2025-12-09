/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify graceful shutdown handler correctly handles SIGINT/SIGTERM signals and saves session state"
 * @test-type unit
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ShutdownHandler,
  createShutdownHandler,
} from "../runtime/shutdown.js";
import type { Session, SessionStatus } from "../runtime/session.js";

/**
 * Create a mock session for testing.
 */
function createMockSession(id = "test-session-123"): Session {
  const mockSession = {
    id,
    setStatus: vi.fn(async (_status: SessionStatus) => {}),
    save: vi.fn(async () => {}),
  } as unknown as Session;
  return mockSession;
}

/**
 * Helper to create a mock exit function that tracks calls.
 */
function createMockExitFn() {
  const calls: number[] = [];
  const exitFn = (code: number) => {
    calls.push(code);
  };
  return { exitFn, calls };
}

describe("ShutdownHandler", () => {
  let signalHandlers: Map<string, (() => void)[]>;

  beforeEach(() => {
    // Suppress console output during tests
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Track registered signal handlers
    signalHandlers = new Map();

    // Mock process.on to capture signal handlers
    vi.spyOn(process, "on").mockImplementation(((event: string, handler: () => void) => {
      if (!signalHandlers.has(event)) {
        signalHandlers.set(event, []);
      }
      signalHandlers.get(event)!.push(handler);
      return process;
    }) as typeof process.on);

    // Mock process.removeListener
    vi.spyOn(process, "removeListener").mockImplementation(((event: string, handler: () => void) => {
      const handlers = signalHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
      return process;
    }) as typeof process.removeListener);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("creates handler with default config", () => {
      const handler = new ShutdownHandler();
      const state = handler.getState();

      expect(state.isShuttingDown).toBe(false);
      expect(state.forceExit).toBe(false);
      expect(state.currentTurnPromise).toBeNull();
    });

    it("creates handler with session config", () => {
      const session = createMockSession();
      const handler = new ShutdownHandler({ session });

      expect(handler.shouldStop()).toBe(false);
    });
  });

  describe("register/unregister", () => {
    it("registers SIGINT and SIGTERM handlers", () => {
      const handler = new ShutdownHandler();
      handler.register();

      expect(signalHandlers.get("SIGINT")).toHaveLength(1);
      expect(signalHandlers.get("SIGTERM")).toHaveLength(1);
    });

    it("only registers once on multiple calls", () => {
      const handler = new ShutdownHandler();
      handler.register();
      handler.register();
      handler.register();

      expect(signalHandlers.get("SIGINT")).toHaveLength(1);
      expect(signalHandlers.get("SIGTERM")).toHaveLength(1);
    });

    it("unregisters signal handlers", () => {
      const handler = new ShutdownHandler();
      handler.register();
      handler.unregister();

      expect(signalHandlers.get("SIGINT")).toHaveLength(0);
      expect(signalHandlers.get("SIGTERM")).toHaveLength(0);
    });

    it("handles unregister when not registered", () => {
      const handler = new ShutdownHandler();
      // Should not throw
      handler.unregister();
    });
  });

  describe("shouldStop", () => {
    it("returns false initially", () => {
      const handler = new ShutdownHandler();
      expect(handler.shouldStop()).toBe(false);
    });

    it("returns true after first signal", async () => {
      const { exitFn, calls } = createMockExitFn();
      const handler = new ShutdownHandler({ exitFn });
      handler.register();

      // Trigger SIGINT
      const sigintHandler = signalHandlers.get("SIGINT")?.[0];
      expect(sigintHandler).toBeDefined();

      sigintHandler!();
      // Wait for async handler to complete
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(handler.shouldStop()).toBe(true);
      expect(calls).toContain(0);
    });
  });

  describe("current turn tracking", () => {
    it("tracks current turn promise", () => {
      const handler = new ShutdownHandler();
      const turnPromise = Promise.resolve();

      handler.setCurrentTurn(turnPromise);
      expect(handler.getState().currentTurnPromise).toBe(turnPromise);

      handler.clearCurrentTurn();
      expect(handler.getState().currentTurnPromise).toBeNull();
    });
  });

  describe("reset", () => {
    it("resets all state", () => {
      const handler = new ShutdownHandler();
      
      // Manually set state for testing
      handler.setCurrentTurn(Promise.resolve());
      
      handler.reset();
      
      const state = handler.getState();
      expect(state.isShuttingDown).toBe(false);
      expect(state.forceExit).toBe(false);
      expect(state.currentTurnPromise).toBeNull();
    });
  });

  describe("setSession", () => {
    it("updates session reference", () => {
      const handler = new ShutdownHandler();
      const session = createMockSession("new-session");

      handler.setSession(session);

      // Verify by checking that session methods would be called on shutdown
      // (We can't directly access the config, but we can verify behavior)
      expect(handler.shouldStop()).toBe(false);
    });
  });

  describe("graceful shutdown behavior", () => {
    it("saves session state on first signal", async () => {
      const session = createMockSession();
      const { exitFn, calls } = createMockExitFn();
      const handler = new ShutdownHandler({ session, exitFn });
      handler.register();

      const sigintHandler = signalHandlers.get("SIGINT")?.[0];
      expect(sigintHandler).toBeDefined();

      sigintHandler!();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(session.setStatus).toHaveBeenCalledWith("paused");
      expect(calls).toContain(0);
    });

    it("waits for current turn before saving", async () => {
      const session = createMockSession();
      const { exitFn, calls } = createMockExitFn();
      const handler = new ShutdownHandler({ session, exitFn });
      handler.register();

      let turnCompleted = false;
      const turnPromise = new Promise<void>(resolve => {
        setTimeout(() => {
          turnCompleted = true;
          resolve();
        }, 20);
      });

      handler.setCurrentTurn(turnPromise);

      const sigintHandler = signalHandlers.get("SIGINT")?.[0];

      sigintHandler!();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(turnCompleted).toBe(true);
      expect(session.setStatus).toHaveBeenCalledWith("paused");
      expect(calls).toContain(0);
    });

    it("invokes custom shutdown callback", async () => {
      const onShutdown = vi.fn(async () => {});
      const { exitFn } = createMockExitFn();
      const handler = new ShutdownHandler({ onShutdown, exitFn });
      handler.register();

      const sigintHandler = signalHandlers.get("SIGINT")?.[0];

      sigintHandler!();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onShutdown).toHaveBeenCalledWith(false);
    });

    it("handles SIGTERM same as SIGINT", async () => {
      const session = createMockSession();
      const { exitFn, calls } = createMockExitFn();
      const handler = new ShutdownHandler({ session, exitFn });
      handler.register();

      const sigtermHandler = signalHandlers.get("SIGTERM")?.[0];
      expect(sigtermHandler).toBeDefined();

      sigtermHandler!();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(session.setStatus).toHaveBeenCalledWith("paused");
      expect(calls).toContain(0);
    });
  });

  describe("forced exit behavior", () => {
    it("sets forceExit on second signal", async () => {
      const session = createMockSession();
      const { exitFn, calls } = createMockExitFn();
      const handler = new ShutdownHandler({ session, exitFn });
      handler.register();

      // Create a long-running turn that won't complete
      const neverResolves = new Promise<void>(() => {});
      handler.setCurrentTurn(neverResolves);

      const sigintHandler = signalHandlers.get("SIGINT")?.[0];

      // First signal - starts graceful shutdown
      // Don't await - it will wait for the turn that never completes
      sigintHandler!();

      // Wait a bit for the first signal to be processed
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(handler.shouldStop()).toBe(true);
      expect(handler.isForced()).toBe(false);

      // Second signal - force exit
      sigintHandler!();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(handler.isForced()).toBe(true);
      expect(calls).toContain(1);
    });

    it("attempts to save partial state on forced exit", async () => {
      const session = createMockSession();
      const { exitFn, calls } = createMockExitFn();
      const handler = new ShutdownHandler({ session, exitFn });
      handler.register();

      // Create a long-running turn
      const neverResolves = new Promise<void>(() => {});
      handler.setCurrentTurn(neverResolves);

      const sigintHandler = signalHandlers.get("SIGINT")?.[0];

      // First signal
      sigintHandler!();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Second signal - force exit
      sigintHandler!();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Session.setStatus should be called for partial save
      expect(session.setStatus).toHaveBeenCalledWith("paused");
      expect(calls).toContain(1);
    });
  });

  describe("error handling", () => {
    it("handles session save errors gracefully", async () => {
      const session = createMockSession();
      (session.setStatus as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Save failed"));

      const { exitFn, calls } = createMockExitFn();
      const handler = new ShutdownHandler({ session, exitFn });
      handler.register();

      const sigintHandler = signalHandlers.get("SIGINT")?.[0];

      // Should not throw despite save error
      sigintHandler!();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Exit should still be called
      expect(calls).toContain(0);
    });

    it("handles shutdown callback errors gracefully", async () => {
      const onShutdown = vi.fn(async () => {
        throw new Error("Callback failed");
      });
      const { exitFn, calls } = createMockExitFn();
      const handler = new ShutdownHandler({ onShutdown, exitFn });
      handler.register();

      const sigintHandler = signalHandlers.get("SIGINT")?.[0];

      // Should not throw despite callback error
      sigintHandler!();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onShutdown).toHaveBeenCalled();
      expect(calls).toContain(0);
    });

    it("handles turn promise rejection gracefully", async () => {
      const session = createMockSession();
      const { exitFn, calls } = createMockExitFn();
      const handler = new ShutdownHandler({ session, exitFn });
      handler.register();

      const failingTurn = Promise.reject(new Error("Turn failed"));
      // Prevent unhandled rejection
      failingTurn.catch(() => {});
      handler.setCurrentTurn(failingTurn);

      const sigintHandler = signalHandlers.get("SIGINT")?.[0];

      sigintHandler!();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should still save session despite turn error
      expect(session.setStatus).toHaveBeenCalledWith("paused");
      expect(calls).toContain(0);
    });
  });

  describe("console output", () => {
    it("displays graceful shutdown message", async () => {
      const { exitFn } = createMockExitFn();
      const handler = new ShutdownHandler({ exitFn });
      handler.register();

      const sigintHandler = signalHandlers.get("SIGINT")?.[0];

      sigintHandler!();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Graceful shutdown initiated")
      );
    });

    it("displays resume message with session ID", async () => {
      const session = createMockSession("my-session-id");
      const { exitFn } = createMockExitFn();
      const handler = new ShutdownHandler({ session, exitFn });
      handler.register();

      const sigintHandler = signalHandlers.get("SIGINT")?.[0];

      sigintHandler!();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("choragen agent:resume my-session-id")
      );
    });

    it("displays forced exit warning", async () => {
      const { exitFn } = createMockExitFn();
      const handler = new ShutdownHandler({ exitFn });
      handler.register();

      const neverResolves = new Promise<void>(() => {});
      handler.setCurrentTurn(neverResolves);

      const sigintHandler = signalHandlers.get("SIGINT")?.[0];

      // First signal
      sigintHandler!();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Second signal
      sigintHandler!();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Forced exit")
      );
    });
  });
});

describe("createShutdownHandler", () => {
  it("creates handler with default config", () => {
    const handler = createShutdownHandler();
    expect(handler).toBeInstanceOf(ShutdownHandler);
    expect(handler.shouldStop()).toBe(false);
  });

  it("creates handler with custom config", () => {
    const session = createMockSession();
    const onShutdown = vi.fn();
    const handler = createShutdownHandler({ session, onShutdown });

    expect(handler).toBeInstanceOf(ShutdownHandler);
  });
});
