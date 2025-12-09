// ADR: ADR-001-task-file-format

/**
 * Menu module exports.
 *
 * This module provides the interactive menu interface for the
 * Choragen Agent Runtime CLI.
 */

// Types
export type {
  MenuOption,
  MenuOptionId,
  MenuResult,
  MainMenuConfig,
  MenuContext,
} from "./types.js";

// Main menu
export {
  MAIN_MENU_OPTIONS,
  getMenuOptions,
  showMainMenu,
  getMenuOptionById,
  getMenuOptionIds,
  executeMenuAction,
  runMenuLoop,
  type MenuActionHandler,
  type MenuActionResult,
} from "./main-menu.js";

// Utils
export { countPausedSessions, getSessionCounts } from "./utils.js";

// Prompts
export type {
  WizardStepResult,
  SessionConfig,
} from "./prompts.js";
export {
  wrapPromptResult,
  promptRole,
  promptProvider,
  promptModel,
  promptTokenLimit,
  promptCostLimit,
  promptRequireApproval,
  promptTaskDescription,
  promptConfirmation,
  formatSessionConfig,
} from "./prompts.js";

// Start session wizard
export type { StartSessionResult } from "./start-session.js";
export {
  runStartSessionWizard,
  startSession,
  hasProviderApiKey,
} from "./start-session.js";

// Session list utilities
export type {
  SessionStatusFilter,
  SessionDisplayInfo,
  PaginatedSessionList,
} from "./session-list.js";
export {
  SESSION_PAGE_SIZE,
  formatSessionForDisplay,
  formatTimestamp,
  formatTokenCount,
  getContextHint,
  filterSessionsByStatus,
  paginateSessions,
  getStatusEmoji,
  getStatusLabel,
  formatSessionTableRow,
  buildSessionSelectOptions,
  canResumeSession,
} from "./session-list.js";

// Session browser
export type {
  BrowserMode,
  SessionBrowserResult,
  SessionDetailView,
} from "./session-browser.js";
export {
  runSessionBrowser,
  getResumableSessions,
  getFilteredSessions,
} from "./session-browser.js";

// Settings menu
export type { SettingsMenuResult } from "./settings.js";
export {
  runSettingsMenu,
  getSettingsOptions,
} from "./settings.js";
