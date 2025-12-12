/**
 * @design-doc docs/design/core/features/web-api.md
 * @user-intent "Verify workflow router exposes WorkflowManager operations via tRPC"
 * @test-type unit
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers";
import { TRPCError } from "@trpc/server";
import { loadTemplate, type WorkflowMessage, type WorkflowTemplate } from "@choragen/core";

const mockWorkflow = {
  id: "WF-20251211-001",
  requestId: "CR-20251211-001",
  template: "standard",
  currentStage: 0,
  status: "active",
  stages: [],
  messages: [],
  createdAt: new Date("2025-12-11T00:00:00Z"),
  updatedAt: new Date("2025-12-11T00:00:00Z"),
};

const mockTemplate: WorkflowTemplate = {
  name: "standard",
  stages: [],
  builtin: true,
  version: 1,
  createdAt: new Date("2025-12-11T00:00:00Z"),
  updatedAt: new Date("2025-12-11T00:00:00Z"),
};

// Mock @choragen/core
const mockWorkflowManager = {
  create: vi.fn(),
  get: vi.fn(),
  list: vi.fn(),
  addMessage: vi.fn(),
  satisfyGate: vi.fn(),
  updateStatus: vi.fn(),
};

vi.mock("@choragen/core", () => ({
  WorkflowManager: vi.fn().mockImplementation(() => mockWorkflowManager),
  WORKFLOW_STATUSES: ["active", "paused", "completed", "failed", "cancelled"] as const,
  MESSAGE_ROLES: ["human", "control", "impl", "system"] as const,
  loadTemplate: vi.fn(),
}));

const mockedLoadTemplate = vi.mocked(loadTemplate);

describe("workflow router", () => {
  const createCaller = createCallerFactory(appRouter);
  const caller = createCaller({ projectRoot: "/tmp/test" });

  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkflowManager.create.mockResolvedValue(mockWorkflow);
    mockWorkflowManager.get.mockResolvedValue(mockWorkflow);
    mockWorkflowManager.list.mockResolvedValue([mockWorkflow]);
    mockWorkflowManager.addMessage.mockResolvedValue(mockWorkflow);
    mockWorkflowManager.satisfyGate.mockResolvedValue(mockWorkflow);
    mockWorkflowManager.updateStatus.mockResolvedValue(mockWorkflow);
    mockedLoadTemplate.mockResolvedValue(mockTemplate);
  });

  function createMessage(id: string, content: string, timestamp: string): WorkflowMessage {
    return {
      id,
      role: "human",
      content,
      stageIndex: 0,
      timestamp: new Date(timestamp),
    };
  }

  describe("create", () => {
    it("creates workflow using standard template", async () => {
      const input = { requestId: "CR-20251211-001", template: "standard" };

      const result = await caller.workflow.create(input);

      expect(result).toEqual(mockWorkflow);
      expect(mockedLoadTemplate).toHaveBeenCalledWith("/tmp/test", "standard");
      expect(mockWorkflowManager.create).toHaveBeenCalledWith({
        requestId: input.requestId,
        template: mockTemplate,
      });
    });
  });

  describe("get", () => {
    it("returns workflow by ID", async () => {
      const result = await caller.workflow.get("WF-20251211-001");

      expect(result).toEqual(mockWorkflow);
      expect(mockWorkflowManager.get).toHaveBeenCalledWith("WF-20251211-001");
    });

    it("throws NOT_FOUND when workflow missing", async () => {
      mockWorkflowManager.get.mockResolvedValueOnce(null);

      const call = caller.workflow.get("WF-missing");

      await expect(call).rejects.toThrow(TRPCError);
      await expect(call).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("list", () => {
    it("returns workflows with filters", async () => {
      const filters = { status: "active" as const, requestId: "CR-20251211-001" };

      const result = await caller.workflow.list(filters);

      expect(result).toEqual([mockWorkflow]);
      expect(mockWorkflowManager.list).toHaveBeenCalledWith(filters);
    });

    it("returns workflows with empty filters", async () => {
      const result = await caller.workflow.list();

      expect(result).toEqual([mockWorkflow]);
      expect(mockWorkflowManager.list).toHaveBeenCalledWith({});
    });
  });

  describe("sendMessage", () => {
    it("adds message via WorkflowManager", async () => {
      const input = {
        workflowId: "WF-20251211-001",
        role: "impl" as const,
        content: "Hello",
        stageIndex: 0,
        metadata: { toolCalls: [{ name: "echo", args: "hi" }] },
      };

      const result = await caller.workflow.sendMessage(input);

      expect(result).toEqual(mockWorkflow);
      expect(mockWorkflowManager.addMessage).toHaveBeenCalledWith(
        input.workflowId,
        {
          role: "impl",
          content: "Hello",
          stageIndex: 0,
          metadata: { toolCalls: [{ name: "echo", args: "hi" }] },
        }
      );
    });

    it("throws BAD_REQUEST on manager error", async () => {
      mockWorkflowManager.addMessage.mockRejectedValueOnce(
        new Error("Stage missing")
      );

      await expect(
        caller.workflow.sendMessage({
          workflowId: "WF-20251211-001",
          role: "impl",
          content: "Hello",
          stageIndex: 99,
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("satisfyGate", () => {
    it("satisfies gate on workflow", async () => {
      const result = await caller.workflow.satisfyGate({
        workflowId: "WF-20251211-001",
        stageIndex: 0,
        satisfiedBy: "human",
      });

      expect(result).toEqual(mockWorkflow);
      expect(mockWorkflowManager.satisfyGate).toHaveBeenCalledWith(
        "WF-20251211-001",
        0,
        "human"
      );
    });

    it("throws BAD_REQUEST on manager error", async () => {
      mockWorkflowManager.satisfyGate.mockRejectedValueOnce(
        new Error("Gate cannot be satisfied")
      );

      await expect(
        caller.workflow.satisfyGate({
          workflowId: "WF-20251211-001",
          stageIndex: 0,
          satisfiedBy: "human",
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("getHistory", () => {
    it("returns paginated, sorted messages", async () => {
      const messageA = {
        id: "1",
        role: "human" as const,
        content: "First",
        stageIndex: 0,
        timestamp: new Date("2025-01-01T00:00:00Z"),
      };
      const messageB = {
        id: "2",
        role: "impl" as const,
        content: "Second",
        stageIndex: 0,
        timestamp: new Date("2025-01-02T00:00:00Z"),
      };
      mockWorkflowManager.get.mockResolvedValue({
        ...mockWorkflow,
        messages: [messageB, messageA],
      });

      const result = await caller.workflow.getHistory({
        workflowId: "WF-20251211-001",
        limit: 1,
        offset: 0,
      });

      expect(result).toEqual([messageA]);
    });

    it("throws NOT_FOUND when workflow missing", async () => {
      mockWorkflowManager.get.mockResolvedValueOnce(null);

      await expect(
        caller.workflow.getHistory({ workflowId: "WF-missing" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("updateStatus", () => {
    it("updates workflow status", async () => {
      const result = await caller.workflow.updateStatus({
        workflowId: "WF-20251211-001",
        status: "paused",
      });

      expect(result).toEqual(mockWorkflow);
      expect(mockWorkflowManager.updateStatus).toHaveBeenCalledWith(
        "WF-20251211-001",
        "paused"
      );
    });

    it("throws BAD_REQUEST on error", async () => {
      mockWorkflowManager.updateStatus.mockRejectedValueOnce(
        new Error("Cannot pause completed workflow")
      );

      await expect(
        caller.workflow.updateStatus({
          workflowId: "WF-20251211-001",
          status: "paused",
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("cancel", () => {
    it("cancels workflow via updateStatus", async () => {
      const result = await caller.workflow.cancel({ workflowId: "WF-20251211-001" });

      expect(result).toEqual(mockWorkflow);
      expect(mockWorkflowManager.updateStatus).toHaveBeenCalledWith(
        "WF-20251211-001",
        "cancelled"
      );
    });

    it("throws BAD_REQUEST on cancel failure", async () => {
      mockWorkflowManager.updateStatus.mockRejectedValueOnce(new Error("Already completed"));

      await expect(
        caller.workflow.cancel({ workflowId: "WF-20251211-001" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("pause", () => {
    it("pauses workflow", async () => {
      const result = await caller.workflow.pause({ workflowId: "WF-20251211-001" });

      expect(result).toEqual(mockWorkflow);
      expect(mockWorkflowManager.updateStatus).toHaveBeenCalledWith(
        "WF-20251211-001",
        "paused"
      );
    });

    it("throws BAD_REQUEST on pause failure", async () => {
      mockWorkflowManager.updateStatus.mockRejectedValueOnce(new Error("Already paused"));

      await expect(
        caller.workflow.pause({ workflowId: "WF-20251211-001" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("resume", () => {
    it("resumes workflow to active", async () => {
      const result = await caller.workflow.resume({ workflowId: "WF-20251211-001" });

      expect(result).toEqual(mockWorkflow);
      expect(mockWorkflowManager.updateStatus).toHaveBeenCalledWith(
        "WF-20251211-001",
        "active"
      );
    });

    it("throws BAD_REQUEST on resume failure", async () => {
      mockWorkflowManager.updateStatus.mockRejectedValueOnce(new Error("Cannot resume"));

      await expect(
        caller.workflow.resume({ workflowId: "WF-20251211-001" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("onMessage subscription", () => {
    it("yields existing messages on subscribe", async () => {
      const messages = [
        createMessage("1", "Hello", "2025-01-01T00:00:00Z"),
        createMessage("2", "World", "2025-01-02T00:00:00Z"),
      ];
      mockWorkflowManager.get.mockResolvedValue({
        ...mockWorkflow,
        messages,
      });

      const iterator = (
        await caller.workflow.onMessage({
          workflowId: mockWorkflow.id,
        })
      )[Symbol.asyncIterator]();

      const first = await iterator.next();
      const second = await iterator.next();

      expect(first.value).toEqual(messages[0]);
      expect(second.value).toEqual(messages[1]);

      await iterator.return?.();
    });

    it("yields new messages after polling", async () => {
      vi.useFakeTimers();
      const initialMessage = createMessage("1", "Initial", "2025-01-01T00:00:00Z");
      const newMessage = createMessage("2", "New message", "2025-01-01T00:01:00Z");

      mockWorkflowManager.get
        .mockResolvedValueOnce({
          ...mockWorkflow,
          messages: [initialMessage],
        })
        .mockResolvedValueOnce({
          ...mockWorkflow,
          messages: [initialMessage, newMessage],
        });

      try {
        const iterator = (
          await caller.workflow.onMessage({
            workflowId: mockWorkflow.id,
          })
        )[Symbol.asyncIterator]();

        const first = await iterator.next();
        expect(first.value).toEqual(initialMessage);

        const nextValue = iterator.next();
        await vi.advanceTimersByTimeAsync(500);
        const result = await nextValue;

        expect(result.value).toEqual(newMessage);
        await iterator.return?.();
      } finally {
        vi.useRealTimers();
      }
    });

    it("stops polling after unsubscribe", async () => {
      vi.useFakeTimers();
      const firstMessage = createMessage("1", "Hello", "2025-01-01T00:00:00Z");
      const secondMessage = createMessage("2", "Later", "2025-01-01T00:01:00Z");

      mockWorkflowManager.get
        .mockResolvedValueOnce({
          ...mockWorkflow,
          messages: [firstMessage],
        })
        .mockResolvedValueOnce({
          ...mockWorkflow,
          messages: [firstMessage, secondMessage],
        });

      try {
        const iterator = (
          await caller.workflow.onMessage({
            workflowId: mockWorkflow.id,
          })
        )[Symbol.asyncIterator]();
        await iterator.next(); // consume existing message

        const pending = iterator.next(); // start poll
        await vi.advanceTimersByTimeAsync(500);
        const polled = await pending;
        expect(polled.value).toEqual(secondMessage);

        const callCountBefore = mockWorkflowManager.get.mock.calls.length;
        await iterator.return?.();
        await vi.advanceTimersByTimeAsync(1000);

        expect(mockWorkflowManager.get.mock.calls.length).toBe(callCountBefore);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
