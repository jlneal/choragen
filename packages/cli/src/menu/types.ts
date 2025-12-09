// ADR: ADR-001-task-file-format

/**
 * Menu types and interfaces for the interactive agent interface.
 *
 * These types define the menu structure that powers the interactive CLI.
 * The menu is designed to be testable without TTY by separating the
 * option definitions from the rendering logic.
 */

/**
 * Unique identifier for each menu option
 */
export type MenuOptionId =
  | "start-session"
  | "resume-session"
  | "list-sessions"
  | "cleanup-sessions"
  | "settings"
  | "exit";

/**
 * A single menu option with its display properties
 */
export interface MenuOption {
  /** Unique identifier for the option */
  id: MenuOptionId;
  /** Display label shown to the user */
  label: string;
  /** Optional hint text shown alongside the label */
  hint?: string;
  /** Whether this option is currently disabled */
  disabled?: boolean;
}

/**
 * Result from displaying the main menu
 */
export interface MenuResult {
  /** The selected option ID, or null if cancelled */
  selected: MenuOptionId | null;
  /** Whether the user cancelled the menu (e.g., Ctrl+C) */
  cancelled: boolean;
}

/**
 * Configuration for the main menu display
 */
export interface MainMenuConfig {
  /** Number of paused sessions to show in hint */
  pausedSessionCount?: number;
  /** Whether to show the settings option */
  showSettings?: boolean;
}

/**
 * Context passed to menu handlers
 */
export interface MenuContext {
  /** Workspace root directory */
  workspaceRoot: string;
  /** Whether running in non-interactive mode */
  nonInteractive?: boolean;
}
