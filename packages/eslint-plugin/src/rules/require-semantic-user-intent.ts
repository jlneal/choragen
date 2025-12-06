// ADR: ADR-002-governance-schema

/**
 * Rule: require-semantic-user-intent
 *
 * Validates that @user-intent metadata in test files contains meaningful
 * descriptions, not placeholder text or gibberish.
 *
 * Validates:
 * - Intent follows "As a... I want... so that..." or similar patterns
 * - Intent contains action verbs and nouns
 * - Intent is not just repeated characters or nonsense
 *
 * Valid:
 *   @user-intent "Verify user can create a task chain from a CR"
 *   @user-intent "Ensure governance rules block invalid mutations"
 *
 * Invalid:
 *   @user-intent "Test the function"
 *   @user-intent "Verify it works"
 *   @user-intent "Check the component"
 *   @user-intent "asdf" (too short)
 */

import type { Rule } from "eslint";

const METADATA_SEARCH_LINE_LIMIT = 20;
const USER_INTENT_PATTERN = /@user-intent\s+["']([^"']+)["']/i;

// Minimum requirements for a valid user intent
const MIN_WORD_COUNT = 5;
const MIN_UNIQUE_WORDS = 4;

// Common action verbs that indicate real user intent
// Includes both user-facing actions and test/developer verification actions
const ACTION_VERBS = new Set([
  // User actions - CRUD
  "add", "create", "delete", "remove", "update", "edit", "modify", "change",
  // User actions - viewing
  "view", "see", "display", "show", "hide", "toggle", "enable", "disable",
  // User actions - data
  "save", "load", "fetch", "get", "set", "submit", "send", "receive",
  // User actions - auth
  "login", "logout", "authenticate", "authorize", "register", "signup",
  // User actions - discovery
  "search", "find", "filter", "sort", "order", "group", "select", "choose",
  // User actions - navigation
  "navigate", "go", "redirect", "route", "visit", "access", "open", "close",
  // User actions - collaboration
  "share", "invite", "collaborate", "join", "leave", "connect", "disconnect",
  // User actions - file operations
  "upload", "download", "import", "export", "sync", "refresh", "reload",
  // User actions - validation
  "validate", "verify", "confirm", "check", "test", "ensure", "require",
  // User actions - organization
  "manage", "organize", "arrange", "plan", "schedule", "book", "reserve",
  // User actions - communication
  "notify", "alert", "warn", "inform", "remind", "message", "email",
  // User actions - monitoring
  "track", "monitor", "log", "record", "audit", "report", "analyze",
  // User actions - configuration
  "configure", "customize", "personalize", "prefer", "settings",
  // User actions - undo/redo
  "cancel", "undo", "redo", "revert", "restore", "reset", "clear",
  // Test/verification actions (for test file intents)
  "assert", "expect", "mock", "stub", "spy", "fake", "simulate",
  "render", "mount", "unmount", "click", "type", "press", "hover",
  "wait", "poll", "retry", "timeout", "delay",
  "catch", "throw", "reject", "resolve", "handle",
  "provide", "provides", "providing", "expose", "inject", "supply", "pass",
  // UI interaction verbs
  "expand", "collapse", "scroll", "drag", "drop", "resize", "zoom",
  "focus", "blur", "activate", "deactivate", "highlight", "dim",
  // State verbs
  "keep", "maintain", "preserve", "persist", "retain", "store",
  "propagate", "broadcast", "emit", "dispatch", "trigger", "fire",
  // Lifecycle verbs
  "initialize", "setup", "teardown", "cleanup", "dispose", "destroy",
  "start", "stop", "pause", "resume", "restart", "abort",
  // Comparison/guard verbs
  "guard", "protect", "prevent", "block", "allow", "permit", "deny",
  "match", "compare", "diff", "merge", "split", "combine",
  // Documentation/coordination verbs
  "describe", "document", "coordinate", "orchestrate", "sequence",
  // Outcome/result verbs (for describing expected behavior)
  "return", "respond", "produce", "yield", "generate", "output",
  "succeed", "fail", "error", "complete", "finish", "end",
  // Behavioral verbs
  "behave", "act", "react", "work", "function", "operate", "run",
  "surface", "appear", "disappear", "remain", "stay", "become",
  // Constraint verbs
  "must", "should", "shall", "need", "needs", "can", "cannot", "may",
  // Transformation verbs
  "transform", "convert", "normalize", "format", "parse", "serialize",
  "encode", "decode", "encrypt", "decrypt", "compress", "decompress",
  // Relationship verbs
  "link", "unlink", "associate", "dissociate", "bind", "unbind",
  "attach", "detach", "embed", "extract", "include", "exclude",
  // Validation/assertion verbs for test contexts
  "accepts", "rejects", "allows", "denies", "enforces", "applies",
  "respects", "ignores", "honors", "violates", "satisfies", "meets",
  // Gerund/present participle forms
  "cancelling", "canceling", "creating", "updating", "deleting", "removing",
  "adding", "editing", "modifying", "viewing", "displaying", "showing",
  "saving", "loading", "fetching", "submitting", "sending", "receiving",
  "searching", "filtering", "sorting", "selecting", "navigating", "accessing",
  "sharing", "inviting", "joining", "leaving", "connecting", "disconnecting",
  "uploading", "downloading", "importing", "exporting", "syncing", "refreshing",
  "validating", "verifying", "confirming", "checking", "testing", "ensuring",
  "managing", "organizing", "planning", "scheduling", "booking", "reserving",
  "configuring", "customizing", "personalizing", "tracking", "monitoring",
  // Third person singular forms
  "creates", "updates", "deletes", "removes", "adds", "edits", "modifies",
  "views", "displays", "shows", "hides", "toggles", "enables", "disables",
  "saves", "loads", "fetches", "gets", "sets", "submits", "sends", "receives",
  "searches", "finds", "filters", "sorts", "selects", "chooses", "navigates",
  "shares", "invites", "joins", "leaves", "connects", "disconnects",
  "uploads", "downloads", "imports", "exports", "syncs", "refreshes", "reloads",
  "validates", "verifies", "confirms", "checks", "tests", "ensures", "requires",
  "manages", "organizes", "plans", "schedules", "books", "reserves",
  "notifies", "alerts", "warns", "informs", "reminds", "messages", "emails",
  "tracks", "monitors", "logs", "records", "audits", "reports", "analyzes",
  "configures", "customizes", "personalizes", "cancels", "reverts", "restores",
  "returns", "responds", "produces", "yields", "generates", "outputs", "emits",
  // Reconciliation/adjustment verbs
  "reconcile", "reconciles", "adjust", "adjusts", "correct", "corrects",
  "cover", "covers", "reflect", "reflects", "represent", "represents",
  // State/continuity verbs
  "stays", "remains", "keeps", "maintains", "preserves", "retains",
  // Merge/combine verbs
  "merges", "combines", "integrates", "consolidates", "aggregates",
  // Replace/substitute verbs
  "replace", "replaces", "substitute", "substitutes", "swap", "swaps",
  // Exercise/practice verbs
  "exercise", "exercises", "practice", "practices", "demonstrate", "demonstrates",
  // Capture/record verbs
  "capture", "captures", "snapshot", "snapshots",
  // Structure/organize verbs
  "structure", "structures", "arranges",
  // Translate/transform verbs
  "translate", "translates", "map", "maps", "converts",
  // Retrieve/obtain verbs
  "retrieve", "retrieves", "obtain", "obtains", "acquire", "acquires",
  // Make/ensure phrases
  "make", "makes", "let", "lets", "have", "has", "having",
  // Respect/honor verbs
  "respect", "obey", "obeys", "follow", "follows",
  // Render/display verbs
  "renders", "rendering", "paint", "paints", "draw", "draws",
  // List/enumerate verbs
  "list", "lists", "listing", "enumerate", "enumerates", "iterate", "iterates",
  // Handle/process verbs
  "handles", "handling", "process", "processes", "processing",
  // Expose/reveal verbs
  "exposes", "exposing", "reveal", "reveals", "uncover", "uncovers",
  // Trace/debug verbs
  "trace", "traces", "tracing", "debug", "debugs", "inspect", "inspects",
  // Wire/connect verbs
  "wire", "wires", "wiring", "hook", "hooks", "hooking", "plug", "plugs",
  // Enforce/guarantee verbs
  "enforce", "enforcing", "guarantee", "guarantees", "guaranteeing",
  // Wrap/encapsulate verbs
  "wrap", "wraps", "wrapping", "encapsulate", "encapsulates", "encapsulating",
  // Gather/collect verbs
  "gather", "gathers", "gathering", "collect", "collects", "collecting",
  // Summarize verbs (US and UK spellings)
  "summarize", "summarizes", "summarizing", "summarise", "summarises", "summarising",
  // Refine/improve verbs
  "refine", "refines", "refining", "improve", "improves", "improving",
  // Post/publish verbs
  "post", "posts", "posting", "publish", "publishes", "publishing",
  // Rename/relabel verbs
  "rename", "renames", "renaming", "relabel", "relabels", "relabeling",
  // Review/examine verbs
  "review", "reviews", "reviewing", "examine", "examines", "examining",
]);

// User role indicators
const USER_ROLES = new Set([
  "user", "admin", "guest", "member", "owner", "viewer", "editor",
  "traveler", "planner", "organizer", "participant", "collaborator",
  "agent", "manager", "operator", "developer", "tester",
  "control", "implementation", // For agentic contexts
]);

// Placeholder/gibberish patterns
const INVALID_PATTERNS = [
  /^[a-z]{10,}$/i, // Just repeated letters like "aaaaaaaaaa"
  /^(.)\1{4,}/, // Repeated single character
  /^test\s*intent/i, // Generic "test intent"
  /^placeholder/i,
  /^todo/i,
  /^tbd/i,
  /^xxx+/i,
  /^sample/i,
  /^example/i,
  /^lorem/i,
  /^asdf/i,
  /^qwerty/i,
  /^user intent here/i,
  /^describe the intent/i,
  /^fill in/i,
  /^add description/i,
  /^needs? (to be )?(completed|filled|written)/i,
];

interface ValidationResult {
  valid: boolean;
  reason?: string;
  wordCount?: number;
  uniqueWords?: number;
  required?: number;
  quality?: string;
}

/**
 * Check if text contains meaningful user intent
 */
function isValidUserIntent(intentText: string): ValidationResult {
  if (!intentText || typeof intentText !== "string") {
    return { valid: false, reason: "empty" };
  }

  const trimmed = intentText.trim();

  // Check for invalid patterns
  for (const pattern of INVALID_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, reason: "placeholder" };
    }
  }

  // Tokenize into words
  const words = trimmed.toLowerCase().split(/\s+/);

  // Check minimum word count
  if (words.length < MIN_WORD_COUNT) {
    return {
      valid: false,
      reason: "too_short",
      wordCount: words.length,
      required: MIN_WORD_COUNT,
    };
  }

  // Check unique word count (catches repeated words)
  const uniqueWords = new Set(words);
  if (uniqueWords.size < MIN_UNIQUE_WORDS) {
    return {
      valid: false,
      reason: "repetitive",
      uniqueWords: uniqueWords.size,
      required: MIN_UNIQUE_WORDS,
    };
  }

  // Check for action verbs
  const hasActionVerb = words.some((word) => ACTION_VERBS.has(word));
  if (!hasActionVerb) {
    return { valid: false, reason: "no_action_verb" };
  }

  // Check for user role indicators (optional but good signal)
  const hasUserRole = words.some((word) => USER_ROLES.has(word));

  // Check for "As a... I want... so that..." pattern (ideal but not required)
  const hasUserStoryPattern =
    /\b(as a|when|given|i want|so that|in order to|should be able to)\b/i.test(
      trimmed,
    );

  // Valid if has action verb and either user role or user story pattern
  if (hasActionVerb && (hasUserRole || hasUserStoryPattern)) {
    return { valid: true, quality: "good" };
  }

  // Valid but could be better
  if (hasActionVerb) {
    return { valid: true, quality: "acceptable" };
  }

  return { valid: false, reason: "unclear_intent" };
}

function isTestFile(filename: string): boolean {
  return (
    filename.includes("__tests__") ||
    filename.includes(".test.") ||
    filename.includes(".spec.")
  );
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Validate that @user-intent metadata contains meaningful descriptions",
      category: "Test Quality",
      recommended: true,
    },
    messages: {
      placeholderIntent:
        "@user-intent contains placeholder text. Provide a real user need description. " +
        'Example: "Verify user can create a task chain from a CR"',
      tooShortIntent:
        "@user-intent is too short ({{wordCount}} words, need {{required}}+). " +
        "Describe the complete user need.",
      repetitiveIntent:
        "@user-intent contains too many repeated words ({{uniqueWords}} unique, need {{required}}+). " +
        "Use varied vocabulary to describe the intent.",
      noActionVerb:
        "@user-intent should describe what the user wants to DO. " +
        "Include an action verb like: view, create, update, delete, verify, etc.",
      unclearIntent:
        "@user-intent is unclear. Describe WHO wants to do WHAT and WHY. " +
        'Example: "Control agent can create chains from CRs"',
    },
    schema: [
      {
        type: "object",
        properties: {
          minWordCount: {
            type: "integer",
            default: MIN_WORD_COUNT,
            description: "Minimum word count for user intent",
          },
          requireUserStoryPattern: {
            type: "boolean",
            default: false,
            description: 'Require "As a... I want... so that..." pattern',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const filename = context.filename || context.getFilename();

    // Only check test files
    if (!isTestFile(filename)) {
      return {};
    }

    return {
      Program(node) {
        const sourceCode = context.sourceCode || context.getSourceCode();
        const lines = sourceCode.getText().split("\n");
        const metadataLines = lines
          .slice(0, METADATA_SEARCH_LINE_LIMIT)
          .join("\n");

        const intentMatch = metadataLines.match(USER_INTENT_PATTERN);
        if (!intentMatch) {
          // Let require-test-metadata handle missing intent
          return;
        }

        const intentText = intentMatch[1];
        const validation = isValidUserIntent(intentText);

        if (!validation.valid) {
          let messageId: string;
          let data: Record<string, unknown> = {};

          switch (validation.reason) {
            case "placeholder":
              messageId = "placeholderIntent";
              break;
            case "too_short":
              messageId = "tooShortIntent";
              data = {
                wordCount: validation.wordCount,
                required: validation.required,
              };
              break;
            case "repetitive":
              messageId = "repetitiveIntent";
              data = {
                uniqueWords: validation.uniqueWords,
                required: validation.required,
              };
              break;
            case "no_action_verb":
              messageId = "noActionVerb";
              break;
            default:
              messageId = "unclearIntent";
          }

          context.report({
            node,
            loc: { line: 1, column: 0 },
            messageId,
            data,
          });
        }
      },
    };
  },
};

export default rule;
