/**
 * @design-doc docs/design/core/features/web-dashboard.md
 * @user-intent "Verify CommitHistory component logic for extracting request references and formatting"
 * @test-type unit
 */

import { describe, it, expect } from "vitest";
import {
  extractRequestReferences,
  abbreviateHash,
  formatRelativeDate,
} from "@/components/git/commit-history";

describe("CommitHistory component logic", () => {
  describe("extractRequestReferences", () => {
    it("extracts CR reference from commit message", () => {
      const message = "feat: add feature\n\n[CR-20251209-001]";
      const references = extractRequestReferences(message);

      expect(references).toHaveLength(1);
      expect(references[0]).toEqual({
        match: "[CR-20251209-001]",
        id: "CR-20251209-001",
        type: "CR",
      });
    });

    it("extracts FR reference from commit message", () => {
      const message = "fix: bug fix\n\n[FR-20251209-002]";
      const references = extractRequestReferences(message);

      expect(references).toHaveLength(1);
      expect(references[0]).toEqual({
        match: "[FR-20251209-002]",
        id: "FR-20251209-002",
        type: "FR",
      });
    });

    it("extracts multiple references from commit message", () => {
      const message = "feat: combined work\n\n[CR-20251209-001]\n[FR-20251208-003]";
      const references = extractRequestReferences(message);

      expect(references).toHaveLength(2);
      expect(references[0].id).toBe("CR-20251209-001");
      expect(references[0].type).toBe("CR");
      expect(references[1].id).toBe("FR-20251208-003");
      expect(references[1].type).toBe("FR");
    });

    it("returns empty array when no references found", () => {
      const message = "chore: update dependencies";
      const references = extractRequestReferences(message);

      expect(references).toHaveLength(0);
    });

    it("handles reference in the middle of message", () => {
      const message = "feat: implement [CR-20251209-001] feature request";
      const references = extractRequestReferences(message);

      expect(references).toHaveLength(1);
      expect(references[0].id).toBe("CR-20251209-001");
    });

    it("ignores malformed references", () => {
      const message = "feat: add feature [CR-123] [FR-abc-def]";
      const references = extractRequestReferences(message);

      expect(references).toHaveLength(0);
    });

    it("handles reference at start of message", () => {
      const message = "[CR-20251209-001] initial commit";
      const references = extractRequestReferences(message);

      expect(references).toHaveLength(1);
      expect(references[0].id).toBe("CR-20251209-001");
    });
  });

  describe("abbreviateHash", () => {
    it("abbreviates full hash to 7 characters", () => {
      const fullHash = "abc123def456789012345678901234567890abcd";
      const abbreviated = abbreviateHash(fullHash);

      const EXPECTED_LENGTH = 7;
      expect(abbreviated).toBe("abc123d");
      expect(abbreviated.length).toBe(EXPECTED_LENGTH);
    });

    it("handles short hash gracefully", () => {
      const shortHash = "abc";
      const abbreviated = abbreviateHash(shortHash);

      expect(abbreviated).toBe("abc");
    });

    it("handles exactly 7 character hash", () => {
      const hash = "abc1234";
      const abbreviated = abbreviateHash(hash);

      expect(abbreviated).toBe("abc1234");
    });
  });

  describe("formatRelativeDate", () => {
    it("returns 'just now' for very recent dates", () => {
      const now = new Date();
      const result = formatRelativeDate(now.toISOString());

      expect(result).toBe("just now");
    });

    it("returns minutes ago for dates within an hour", () => {
      const date = new Date();
      const MINUTES_AGO = 5;
      date.setMinutes(date.getMinutes() - MINUTES_AGO);
      const result = formatRelativeDate(date.toISOString());

      expect(result).toBe("5 minutes ago");
    });

    it("returns singular minute for 1 minute ago", () => {
      const date = new Date();
      const MINUTES_AGO = 1;
      date.setMinutes(date.getMinutes() - MINUTES_AGO);
      const result = formatRelativeDate(date.toISOString());

      expect(result).toBe("1 minute ago");
    });

    it("returns hours ago for dates within a day", () => {
      const date = new Date();
      const HOURS_AGO = 3;
      date.setHours(date.getHours() - HOURS_AGO);
      const result = formatRelativeDate(date.toISOString());

      expect(result).toBe("3 hours ago");
    });

    it("returns singular hour for 1 hour ago", () => {
      const date = new Date();
      const HOURS_AGO = 1;
      date.setHours(date.getHours() - HOURS_AGO);
      const result = formatRelativeDate(date.toISOString());

      expect(result).toBe("1 hour ago");
    });

    it("returns days ago for dates within a month", () => {
      const date = new Date();
      const DAYS_AGO = 5;
      date.setDate(date.getDate() - DAYS_AGO);
      const result = formatRelativeDate(date.toISOString());

      expect(result).toBe("5 days ago");
    });

    it("returns singular day for 1 day ago", () => {
      const date = new Date();
      const DAYS_AGO = 1;
      date.setDate(date.getDate() - DAYS_AGO);
      const result = formatRelativeDate(date.toISOString());

      expect(result).toBe("1 day ago");
    });

    it("returns formatted date for dates older than a month", () => {
      const date = new Date();
      const DAYS_AGO = 45;
      date.setDate(date.getDate() - DAYS_AGO);
      const result = formatRelativeDate(date.toISOString());

      // Should be a formatted date string, not relative
      expect(result).not.toContain("ago");
      expect(result).toMatch(/\d/); // Contains numbers (date)
    });
  });
});
