/**
 * @design-doc docs/design/core/features/agent-runtime.md
 * @user-intent "Verify session browser logic for listing, filtering, and resuming sessions"
 * @test-type unit
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SessionSummary } from "../../runtime/index.js";

// Mock the runtime module for browser tests - vi.mock is hoisted
vi.mock("../../runtime/index.js", () => ({
  Session: {
    listAll: vi.fn(),
    load: vi.fn(),
  },
}));

// Import session-list functions (these are pure functions, no mocking needed)
import {
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
  SESSION_PAGE_SIZE,
} from "../../menu/session-list.js";

// Import mocked Session and browser functions
import { Session } from "../../runtime/index.js";
import { getResumableSessions, getFilteredSessions } from "../../menu/session-browser.js";

// Mock session data factory
function createMockSession(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: "session-20251208-143022-abc123",
    role: "impl",
    status: "paused",
    startTime: "2025-12-08T14:30:22.000Z",
    endTime: null,
    tokenUsage: { input: 5000, output: 7000, total: 12000 },
    chainId: null,
    taskId: null,
    ...overrides,
  };
}

describe("Session List Utilities", () => {
  describe("formatTimestamp", () => {
    it("formats ISO timestamp to readable format", () => {
      const result = formatTimestamp("2025-12-08T14:30:22.000Z");
      // Note: Output depends on local timezone, so we just check format
      expect(result).toMatch(/\w{3} \d{1,2}, \d{2}:\d{2}/);
    });
  });

  describe("formatTokenCount", () => {
    it("formats small numbers with commas", () => {
      const result = formatTokenCount(12345);
      expect(result).toBe("12,345");
    });

    it("formats millions with M suffix", () => {
      const ONE_MILLION = 1_000_000;
      const result = formatTokenCount(ONE_MILLION);
      expect(result).toBe("1.0M");
    });

    it("formats large millions with decimal", () => {
      const LARGE_MILLION = 2_500_000;
      const result = formatTokenCount(LARGE_MILLION);
      expect(result).toBe("2.5M");
    });
  });

  describe("getContextHint", () => {
    it("returns paused hint for paused sessions", () => {
      const session = createMockSession({ status: "paused" });
      const result = getContextHint(session);
      expect(result).toContain("Paused");
      expect(result).toContain("12,000");
    });

    it("returns failed hint for failed sessions", () => {
      const session = createMockSession({ status: "failed" });
      const result = getContextHint(session);
      expect(result).toContain("Failed");
    });

    it("returns running hint for running sessions", () => {
      const session = createMockSession({ status: "running" });
      const result = getContextHint(session);
      expect(result).toContain("running");
    });

    it("returns completed hint for completed sessions", () => {
      const session = createMockSession({ status: "completed" });
      const result = getContextHint(session);
      expect(result).toContain("Completed");
    });
  });

  describe("formatSessionForDisplay", () => {
    it("extracts short ID from full session ID", () => {
      const session = createMockSession({ id: "session-20251208-143022-abc123" });
      const result = formatSessionForDisplay(session);
      expect(result.shortId).toBe("abc123");
    });

    it("includes all required fields", () => {
      const session = createMockSession();
      const result = formatSessionForDisplay(session);

      expect(result.id).toBe(session.id);
      expect(result.role).toBe(session.role);
      expect(result.status).toBe(session.status);
      expect(result.startedAt).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.contextHint).toBeDefined();
    });
  });

  describe("filterSessionsByStatus", () => {
    const sessions: SessionSummary[] = [
      createMockSession({ id: "s1", status: "running" }),
      createMockSession({ id: "s2", status: "paused" }),
      createMockSession({ id: "s3", status: "completed" }),
      createMockSession({ id: "s4", status: "failed" }),
      createMockSession({ id: "s5", status: "paused" }),
    ];

    it("returns all sessions when filter is 'all'", () => {
      const result = filterSessionsByStatus(sessions, "all");
      const EXPECTED_COUNT = 5;
      expect(result.length).toBe(EXPECTED_COUNT);
    });

    it("filters by running status", () => {
      const result = filterSessionsByStatus(sessions, "running");
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("s1");
    });

    it("filters by paused status", () => {
      const result = filterSessionsByStatus(sessions, "paused");
      const EXPECTED_PAUSED = 2;
      expect(result.length).toBe(EXPECTED_PAUSED);
    });

    it("filters by completed status", () => {
      const result = filterSessionsByStatus(sessions, "completed");
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("s3");
    });

    it("filters by failed status", () => {
      const result = filterSessionsByStatus(sessions, "failed");
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("s4");
    });

    it("filters resumable sessions (paused or failed)", () => {
      const result = filterSessionsByStatus(sessions, "resumable");
      const EXPECTED_RESUMABLE = 3;
      expect(result.length).toBe(EXPECTED_RESUMABLE);
      expect(result.every((s) => s.status === "paused" || s.status === "failed")).toBe(true);
    });
  });

  describe("paginateSessions", () => {
    // Create 25 mock sessions
    const sessions: SessionSummary[] = Array.from({ length: 25 }, (_, i) =>
      createMockSession({ id: `session-${i.toString().padStart(3, "0")}` })
    );

    it("returns first page with correct count", () => {
      const PAGE_SIZE = 10;
      const result = paginateSessions(sessions, 1, PAGE_SIZE);

      expect(result.sessions.length).toBe(PAGE_SIZE);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(3);
      expect(result.totalSessions).toBe(25);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(false);
    });

    it("returns middle page correctly", () => {
      const PAGE_SIZE = 10;
      const result = paginateSessions(sessions, 2, PAGE_SIZE);

      expect(result.sessions.length).toBe(PAGE_SIZE);
      expect(result.currentPage).toBe(2);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(true);
    });

    it("returns last page with remaining items", () => {
      const PAGE_SIZE = 10;
      const EXPECTED_LAST_PAGE_COUNT = 5;
      const result = paginateSessions(sessions, 3, PAGE_SIZE);

      expect(result.sessions.length).toBe(EXPECTED_LAST_PAGE_COUNT);
      expect(result.currentPage).toBe(3);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(true);
    });

    it("clamps page number to valid range", () => {
      const PAGE_SIZE = 10;
      const result = paginateSessions(sessions, 100, PAGE_SIZE);

      expect(result.currentPage).toBe(3); // Clamped to last page
    });

    it("handles empty session list", () => {
      const result = paginateSessions([], 1, SESSION_PAGE_SIZE);

      expect(result.sessions.length).toBe(0);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.totalSessions).toBe(0);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });

    it("uses default page size when not specified", () => {
      const result = paginateSessions(sessions, 1);

      expect(result.sessions.length).toBe(SESSION_PAGE_SIZE);
    });
  });

  describe("getStatusEmoji", () => {
    it("returns correct emoji for each status", () => {
      expect(getStatusEmoji("running")).toBe("🔄");
      expect(getStatusEmoji("paused")).toBe("⏸️");
      expect(getStatusEmoji("completed")).toBe("✅");
      expect(getStatusEmoji("failed")).toBe("❌");
    });
  });

  describe("getStatusLabel", () => {
    it("returns correct label for each status", () => {
      expect(getStatusLabel("running")).toBe("Running");
      expect(getStatusLabel("paused")).toBe("Paused");
      expect(getStatusLabel("completed")).toBe("Completed");
      expect(getStatusLabel("failed")).toBe("Failed");
    });
  });

  describe("formatSessionTableRow", () => {
    it("formats session info into table row", () => {
      const info = formatSessionForDisplay(createMockSession());
      const result = formatSessionTableRow(info);

      expect(result).toContain("⏸️"); // Paused emoji
      expect(result).toContain("abc123"); // Short ID
      expect(result).toContain("impl"); // Role
    });
  });

  describe("buildSessionSelectOptions", () => {
    it("builds options array for select prompt", () => {
      const sessions = [
        formatSessionForDisplay(createMockSession({ id: "s1" })),
        formatSessionForDisplay(createMockSession({ id: "s2" })),
      ];

      const result = buildSessionSelectOptions(sessions);

      const EXPECTED_OPTIONS = 2;
      expect(result.length).toBe(EXPECTED_OPTIONS);
      expect(result[0].value).toBe("s1");
      expect(result[1].value).toBe("s2");
      expect(result[0].label).toBeDefined();
      expect(result[0].hint).toBeDefined();
    });
  });

  describe("canResumeSession", () => {
    it("returns true for paused sessions", () => {
      expect(canResumeSession("paused")).toBe(true);
    });

    it("returns true for failed sessions", () => {
      expect(canResumeSession("failed")).toBe(true);
    });

    it("returns false for running sessions", () => {
      expect(canResumeSession("running")).toBe(false);
    });

    it("returns false for completed sessions", () => {
      expect(canResumeSession("completed")).toBe(false);
    });
  });
});

describe("Session Browser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getResumableSessions", () => {
    it("returns only paused and failed sessions", async () => {
      vi.mocked(Session.listAll).mockResolvedValue([
        createMockSession({ id: "s1", status: "running" }),
        createMockSession({ id: "s2", status: "paused" }),
        createMockSession({ id: "s3", status: "completed" }),
        createMockSession({ id: "s4", status: "failed" }),
      ]);

      const result = await getResumableSessions("/test/workspace");

      const EXPECTED_RESUMABLE = 2;
      expect(result.length).toBe(EXPECTED_RESUMABLE);
      expect(result.every((s) => s.status === "paused" || s.status === "failed")).toBe(true);
    });

    it("returns empty array when no resumable sessions", async () => {
      vi.mocked(Session.listAll).mockResolvedValue([
        createMockSession({ id: "s1", status: "running" }),
        createMockSession({ id: "s2", status: "completed" }),
      ]);

      const result = await getResumableSessions("/test/workspace");

      expect(result.length).toBe(0);
    });
  });

  describe("getFilteredSessions", () => {
    it("returns all sessions when no filter specified", async () => {
      vi.mocked(Session.listAll).mockResolvedValue([
        createMockSession({ id: "s1", status: "running" }),
        createMockSession({ id: "s2", status: "paused" }),
        createMockSession({ id: "s3", status: "completed" }),
      ]);

      const result = await getFilteredSessions("/test/workspace");

      const EXPECTED_COUNT = 3;
      expect(result.length).toBe(EXPECTED_COUNT);
    });

    it("filters by specified status", async () => {
      vi.mocked(Session.listAll).mockResolvedValue([
        createMockSession({ id: "s1", status: "running" }),
        createMockSession({ id: "s2", status: "paused" }),
        createMockSession({ id: "s3", status: "completed" }),
      ]);

      const result = await getFilteredSessions("/test/workspace", "paused");

      expect(result.length).toBe(1);
      expect(result[0].id).toBe("s2");
    });
  });
});
