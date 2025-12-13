/**
 * @design-doc docs/design/core/features/agent-feedback.md
 * @user-intent "Expose feedback lifecycle via tRPC with validation"
 * @test-type unit
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers";
import type { FeedbackItem } from "@choragen/core";

const mockFeedback: FeedbackItem = {
  id: "FB-001",
  workflowId: "WF-001",
  stageIndex: 0,
  type: "clarification",
  createdByRole: "impl",
  content: "Need more details",
  status: "pending",
  priority: "medium",
  createdAt: new Date("2025-01-01T00:00:00Z"),
  updatedAt: new Date("2025-01-01T00:00:00Z"),
};

const mockFeedbackManager = {
  list: vi.fn(),
  get: vi.fn(),
  respond: vi.fn(),
  dismiss: vi.fn(),
  acknowledge: vi.fn(),
};

vi.mock("@choragen/core", async () => {
  const actual = await vi.importActual<typeof import("@choragen/core")>("@choragen/core");
  return {
    ...actual,
    FeedbackManager: vi.fn().mockImplementation(() => mockFeedbackManager),
  };
});

describe("feedback router", () => {
  const createCaller = createCallerFactory(appRouter);
  const caller = createCaller({ projectRoot: "/tmp/project" });

  beforeEach(() => {
    vi.clearAllMocks();
    mockFeedbackManager.list.mockResolvedValue([mockFeedback]);
    mockFeedbackManager.get.mockResolvedValue(mockFeedback);
    mockFeedbackManager.respond.mockResolvedValue({
      ...mockFeedback,
      status: "resolved",
      response: {
        content: "Here is the answer",
        respondedBy: "reviewer",
        respondedAt: new Date("2025-01-02T00:00:00Z"),
      },
      resolvedAt: new Date("2025-01-02T00:00:00Z"),
      updatedAt: new Date("2025-01-02T00:00:00Z"),
    });
    mockFeedbackManager.dismiss.mockResolvedValue({
      ...mockFeedback,
      status: "dismissed",
      updatedAt: new Date("2025-01-02T00:00:00Z"),
    });
    mockFeedbackManager.acknowledge.mockResolvedValue({
      ...mockFeedback,
      status: "acknowledged",
      updatedAt: new Date("2025-01-02T00:00:00Z"),
    });
  });

  describe("list", () => {
    it("lists feedback with filters", async () => {
      const result = await caller.feedback.list({
        workflowId: "WF-001",
        status: "pending",
      });

      expect(result).toEqual([mockFeedback]);
      expect(mockFeedbackManager.list).toHaveBeenCalledWith({
        workflowId: "WF-001",
        status: "pending",
      });
    });

    it("lists feedback with empty filters", async () => {
      const result = await caller.feedback.list();

      expect(result).toEqual([mockFeedback]);
      expect(mockFeedbackManager.list).toHaveBeenCalledWith({});
    });
  });

  describe("get", () => {
    it("gets feedback by id", async () => {
      const result = await caller.feedback.get({
        feedbackId: "FB-001",
        workflowId: "WF-001",
      });

      expect(result).toEqual(mockFeedback);
      expect(mockFeedbackManager.get).toHaveBeenCalledWith("FB-001", "WF-001");
    });

    it("throws NOT_FOUND when missing", async () => {
      mockFeedbackManager.get.mockResolvedValue(null);

      await expect(
        caller.feedback.get({ feedbackId: "FB-missing", workflowId: "WF-001" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("respond", () => {
    it("responds to feedback and resolves it", async () => {
      const responseAt = new Date("2025-01-03T00:00:00Z");
      const result = await caller.feedback.respond({
        feedbackId: "FB-001",
        workflowId: "WF-001",
        response: {
          content: "Acknowledged",
          selectedOption: "option-a",
          respondedBy: "human",
          respondedAt: responseAt,
        },
      });

      expect(result.status).toBe("resolved");
      expect(mockFeedbackManager.respond).toHaveBeenCalledWith(
        "FB-001",
        expect.objectContaining({
          content: "Acknowledged",
          selectedOption: "option-a",
          respondedBy: "human",
          respondedAt: responseAt,
        }),
        "WF-001"
      );
    });

    it("throws BAD_REQUEST when manager errors", async () => {
      mockFeedbackManager.respond.mockRejectedValueOnce(
        new Error("Cannot respond")
      );

      await expect(
        caller.feedback.respond({
          feedbackId: "FB-001",
          workflowId: "WF-001",
          response: { content: "Ok", respondedBy: "human" },
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("dismiss", () => {
    it("dismisses feedback", async () => {
      const result = await caller.feedback.dismiss({
        feedbackId: "FB-001",
        workflowId: "WF-001",
      });

      expect(result.status).toBe("dismissed");
      expect(mockFeedbackManager.dismiss).toHaveBeenCalledWith(
        "FB-001",
        "WF-001"
      );
    });

    it("throws BAD_REQUEST on dismiss failure", async () => {
      mockFeedbackManager.dismiss.mockRejectedValueOnce(new Error("Already resolved"));

      await expect(
        caller.feedback.dismiss({ feedbackId: "FB-001", workflowId: "WF-001" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("acknowledge", () => {
    it("acknowledges feedback", async () => {
      const result = await caller.feedback.acknowledge({
        feedbackId: "FB-001",
        workflowId: "WF-001",
      });

      expect(result.status).toBe("acknowledged");
      expect(mockFeedbackManager.acknowledge).toHaveBeenCalledWith(
        "FB-001",
        "WF-001"
      );
    });

    it("throws BAD_REQUEST on acknowledge failure", async () => {
      mockFeedbackManager.acknowledge.mockRejectedValueOnce(
        new Error("Not pending")
      );

      await expect(
        caller.feedback.acknowledge({
          feedbackId: "FB-001",
          workflowId: "WF-001",
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });
});
