// ADR: ADR-010-agent-runtime-architecture

/**
 * Graceful shutdown handler for agent runtime.
 * Handles SIGINT/SIGTERM signals, saves session state, and allows clean exit.
 */

import type { Session } from "./session.js";

/**
 * Shutdown state tracking.
 */
export interface ShutdownState {
  /** Whether shutdown has been initiated */
  isShuttingDown: boolean;
  /** Whether forced exit was requested (double Ctrl+C) */
  forceExit: boolean;
  /** Promise for the current turn being processed */
  currentTurnPromise: Promise<void> | null;
}

/**
 * Callback invoked when shutdown is initiated.
 */
export type ShutdownCallback = (forced: boolean) => Promise<void>;

/**
 * Configuration for the shutdown handler.
 */
export interface ShutdownConfig {
  /** Session to save on shutdown */
  session?: Session;
  /** Callback to invoke on shutdown (for custom cleanup) */
  onShutdown?: ShutdownCallback;
  /** Custom exit function (for testing - defaults to process.exit) */
  exitFn?: (code: number) => void;
}

/**
 * Handler for graceful shutdown of agent sessions.
 * 
 * Behavior:
 * - First SIGINT/SIGTERM: Initiate graceful shutdown, wait for current turn, save session
 * - Second SIGINT: Force immediate exit with warning
 * 
 * Usage:
 * ```typescript
 * const handler = new ShutdownHandler({ session });
 * handler.register();
 * 
 * // During loop execution:
 * handler.setCurrentTurn(turnPromise);
 * await turnPromise;
 * handler.clearCurrentTurn();
 * 
 * // Check if shutdown requested:
 * if (handler.shouldStop()) {
 *   break;
 * }
 * ```
 */
export class ShutdownHandler {
  private readonly state: ShutdownState = {
    isShuttingDown: false,
    forceExit: false,
    currentTurnPromise: null,
  };

  private readonly config: ShutdownConfig;
  private readonly exitFn: (code: number) => void;
  private sigintHandler: (() => void) | null = null;
  private sigtermHandler: (() => void) | null = null;
  private registered = false;

  constructor(config: ShutdownConfig = {}) {
    this.config = config;
    this.exitFn = config.exitFn ?? ((code: number) => process.exit(code));
  }

  /**
   * Register signal handlers for SIGINT and SIGTERM.
   * Safe to call multiple times - will only register once.
   */
  register(): void {
    if (this.registered) {
      return;
    }

    this.sigintHandler = () => {
      void this.handleSignal("SIGINT");
    };

    this.sigtermHandler = () => {
      void this.handleSignal("SIGTERM");
    };

    process.on("SIGINT", this.sigintHandler);
    process.on("SIGTERM", this.sigtermHandler);
    this.registered = true;
  }

  /**
   * Unregister signal handlers.
   * Should be called when the session ends normally.
   */
  unregister(): void {
    if (!this.registered) {
      return;
    }

    if (this.sigintHandler) {
      process.removeListener("SIGINT", this.sigintHandler);
      this.sigintHandler = null;
    }

    if (this.sigtermHandler) {
      process.removeListener("SIGTERM", this.sigtermHandler);
      this.sigtermHandler = null;
    }

    this.registered = false;
  }

  /**
   * Handle a shutdown signal.
   */
  private async handleSignal(signal: string): Promise<void> {
    if (this.state.isShuttingDown) {
      // Second signal - force exit
      this.state.forceExit = true;
      console.error("\n⚠️  Forced exit. Session state may be incomplete.");
      
      // Try to save partial state even on forced exit
      await this.savePartialState();
      
      this.exitFn(1);
    }

    // First signal - initiate graceful shutdown
    this.state.isShuttingDown = true;
    console.log(`\n🛑 Graceful shutdown initiated (${signal})...`);

    // Wait for current turn to complete if one is in progress
    if (this.state.currentTurnPromise) {
      console.log("⏳ Waiting for current turn to complete...");
      try {
        await this.state.currentTurnPromise;
      } catch {
        // Ignore errors from current turn - we're shutting down anyway
      }
    }

    // Save session state
    await this.saveSessionState();

    // Invoke custom shutdown callback if provided
    if (this.config.onShutdown) {
      try {
        await this.config.onShutdown(false);
      } catch (err) {
        console.error("Error in shutdown callback:", err);
      }
    }

    // Display resume message
    this.displayResumeMessage();

    // Clean exit
    this.exitFn(0);
  }

  /**
   * Save session state as "paused".
   */
  private async saveSessionState(): Promise<void> {
    const { session } = this.config;
    if (!session) {
      return;
    }

    try {
      await session.setStatus("paused");
      console.log("💾 Session state saved.");
    } catch (err) {
      console.error("Failed to save session state:", err);
    }
  }

  /**
   * Save partial state on forced exit.
   * Best-effort save - may not complete fully.
   */
  private async savePartialState(): Promise<void> {
    const { session } = this.config;
    if (!session) {
      return;
    }

    try {
      // Set status to paused even on forced exit
      // This is a best-effort save
      await session.setStatus("paused");
    } catch {
      // Ignore errors on forced exit - we're exiting anyway
    }
  }

  /**
   * Display the resume message with session ID.
   */
  private displayResumeMessage(): void {
    const { session } = this.config;
    if (session) {
      console.log(`\n📋 Session paused. Resume with: choragen agent:resume ${session.id}`);
    } else {
      console.log("\n📋 Session paused.");
    }
  }

  /**
   * Set the current turn promise.
   * The shutdown handler will wait for this promise before exiting.
   */
  setCurrentTurn(promise: Promise<void>): void {
    this.state.currentTurnPromise = promise;
  }

  /**
   * Clear the current turn promise.
   * Call this after each turn completes.
   */
  clearCurrentTurn(): void {
    this.state.currentTurnPromise = null;
  }

  /**
   * Check if shutdown has been requested.
   * Use this to break out of the main loop.
   */
  shouldStop(): boolean {
    return this.state.isShuttingDown;
  }

  /**
   * Check if forced exit was requested.
   */
  isForced(): boolean {
    return this.state.forceExit;
  }

  /**
   * Get the current shutdown state (for testing).
   */
  getState(): Readonly<ShutdownState> {
    return { ...this.state };
  }

  /**
   * Reset the shutdown state (for testing).
   */
  reset(): void {
    this.state.isShuttingDown = false;
    this.state.forceExit = false;
    this.state.currentTurnPromise = null;
  }

  /**
   * Update the session reference.
   * Useful when the session is created after the handler.
   */
  setSession(session: Session): void {
    (this.config as { session?: Session }).session = session;
  }
}

/**
 * Create a shutdown handler with the given configuration.
 */
export function createShutdownHandler(config: ShutdownConfig = {}): ShutdownHandler {
  return new ShutdownHandler(config);
}

/**
 * Default shutdown handler (no session attached).
 */
export const defaultShutdownHandler = new ShutdownHandler();
