// ADR: ADR-001-task-file-format

/**
 * Main menu scaffold for the interactive agent interface.
 *
 * This module provides the main menu that users see when launching
 * the interactive CLI. It uses @clack/prompts for a modern, aesthetic
 * terminal UI.
 */

import * as p from "@clack/prompts";
import type {
  MenuOption,
  MenuOptionId,
  MenuResult,
  MainMenuConfig,
  MenuContext,
} from "./types.js";
import { countPausedSessions } from "./utils.js";
import { runStartSessionWizard } from "./start-session.js";
import { runSessionBrowser } from "./session-browser.js";
import { runSettingsMenu } from "./settings.js";

/**
 * Main menu option definitions.
 * These are defined as constants for testability and reuse.
 */
export const MAIN_MENU_OPTIONS: readonly MenuOption[] = [
  {
    id: "start-session",
    label: "Start New Session",
  },
  {
    id: "resume-session",
    label: "Resume Session",
  },
  {
    id: "list-sessions",
    label: "List Sessions",
  },
  {
    id: "cleanup-sessions",
    label: "Cleanup Old Sessions",
  },
  {
    id: "settings",
    label: "Settings",
  },
  {
    id: "exit",
    label: "Exit",
  },
] as const;

/**
 * Get menu options with dynamic hints based on configuration.
 *
 * @param config - Configuration for customizing menu display
 * @returns Array of menu options with hints applied
 */
export function getMenuOptions(config: MainMenuConfig = {}): MenuOption[] {
  const { pausedSessionCount = 0, showSettings = true } = config;

  return MAIN_MENU_OPTIONS.map((option) => {
    const result: MenuOption = { ...option };

    // Add hint for paused sessions
    if (option.id === "resume-session" && pausedSessionCount > 0) {
      result.hint = `${pausedSessionCount} paused`;
    }

    // Optionally hide settings
    if (option.id === "settings" && !showSettings) {
      result.disabled = true;
    }

    return result;
  }).filter((option) => !option.disabled);
}

/**
 * Display the main menu and get user selection.
 *
 * This function displays the interactive menu using @clack/prompts
 * and returns the user's selection.
 *
 * @param config - Configuration for customizing menu display
 * @returns The selected menu option or cancellation result
 */
export async function showMainMenu(
  config: MainMenuConfig = {}
): Promise<MenuResult> {
  const options = getMenuOptions(config);

  // Display intro banner
  p.intro("🤖 Choragen Agent Runtime");

  // Show the select prompt
  const selected = await p.select({
    message: "What would you like to do?",
    options: options.map((opt) => ({
      value: opt.id,
      label: opt.label,
      hint: opt.hint,
    })),
  });

  // Handle cancellation (Ctrl+C)
  if (p.isCancel(selected)) {
    p.cancel("Goodbye!");
    return {
      selected: null,
      cancelled: true,
    };
  }

  return {
    selected: selected as MenuOptionId,
    cancelled: false,
  };
}

/**
 * Get a menu option by its ID.
 *
 * @param id - The menu option ID to find
 * @returns The menu option or undefined if not found
 */
export function getMenuOptionById(id: MenuOptionId): MenuOption | undefined {
  return MAIN_MENU_OPTIONS.find((option) => option.id === id);
}

/**
 * Get all menu option IDs.
 *
 * @returns Array of all menu option IDs
 */
export function getMenuOptionIds(): MenuOptionId[] {
  return MAIN_MENU_OPTIONS.map((option) => option.id);
}

/**
 * Action handler type for menu options.
 */
export type MenuActionHandler = (
  context: MenuContext
) => Promise<void>;

/**
 * Result from executing a menu action.
 */
export interface MenuActionResult {
  /** Whether to continue the menu loop */
  continueLoop: boolean;
  /** Optional message to display */
  message?: string;
}

/**
 * Execute the action for a menu option.
 *
 * @param optionId - The selected menu option ID
 * @param context - The menu context
 * @returns Result indicating whether to continue the loop
 */
export async function executeMenuAction(
  optionId: MenuOptionId,
  _context: MenuContext
): Promise<MenuActionResult> {
  switch (optionId) {
    case "start-session": {
      // Run the start session wizard
      const result = await runStartSessionWizard(_context);
      // If session was started, exit the menu loop
      // If cancelled or not started, continue the loop
      return { continueLoop: !result.started };
    }

    case "resume-session": {
      // Run the session browser in resume mode
      const resumeResult = await runSessionBrowser(_context, "resume");
      // If a session was resumed, exit the menu loop
      // Otherwise, continue the loop
      return { continueLoop: !resumeResult.resumed };
    }

    case "list-sessions": {
      // Run the session browser in list mode
      const listResult = await runSessionBrowser(_context, "list");
      // If a session was resumed, exit the menu loop
      // Otherwise, continue the loop
      return { continueLoop: !listResult.resumed };
    }

    case "cleanup-sessions":
      // Display message - actual cleanup is handled by agent:cleanup
      p.log.info("Use 'choragen agent:cleanup [--older-than=<days>]' to remove old sessions.");
      return { continueLoop: true };

    case "settings": {
      // Run the settings menu
      const settingsResult = await runSettingsMenu(_context);
      // Always continue the loop after settings (unless cancelled)
      return { continueLoop: !settingsResult.cancelled };
    }

    case "exit":
      p.outro("Goodbye!");
      return { continueLoop: false };

    default:
      return { continueLoop: true };
  }
}

/**
 * Run the interactive menu loop.
 *
 * This function displays the main menu repeatedly until the user
 * selects Exit or cancels (Ctrl+C / Escape).
 *
 * @param context - The menu context with workspace info
 */
export async function runMenuLoop(context: MenuContext): Promise<void> {
  let continueLoop = true;

  while (continueLoop) {
    // Get paused session count for dynamic hint
    const pausedCount = await countPausedSessions(context.workspaceRoot);

    // Show the menu
    const result = await showMainMenu({ pausedSessionCount: pausedCount });

    // Handle cancellation (Ctrl+C or Escape)
    if (result.cancelled || result.selected === null) {
      p.outro("Goodbye!");
      break;
    }

    // Execute the selected action
    const actionResult = await executeMenuAction(result.selected, context);
    continueLoop = actionResult.continueLoop;

    // Add spacing between menu iterations
    if (continueLoop) {
      console.log("");
    }
  }
}
