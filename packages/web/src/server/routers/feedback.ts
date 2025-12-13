// ADR: ADR-011-web-api-architecture

/**
 * Feedback tRPC Router
 *
 * Exposes FeedbackManager operations for listing, reading, and updating
 * feedback items from the web dashboard.
 */
import { z } from "zod";
import { router, publicProcedure, TRPCError } from "../trpc";
import {
  FeedbackManager,
  FEEDBACK_PRIORITIES,
  FEEDBACK_STATUSES,
  FEEDBACK_TYPES,
  feedbackResponseSchema,
  type FeedbackPriority,
  type FeedbackStatus,
  type FeedbackType,
} from "@choragen/core";

const feedbackTypeEnum = z.enum(
  [...FEEDBACK_TYPES] as [FeedbackType, ...FeedbackType[]]
);

const feedbackStatusEnum = z.enum(
  [...FEEDBACK_STATUSES] as [FeedbackStatus, ...FeedbackStatus[]]
);

const feedbackPriorityEnum = z.enum(
  [...FEEDBACK_PRIORITIES] as [FeedbackPriority, ...FeedbackPriority[]]
);

const listFeedbackInputSchema = z
  .object({
    workflowId: z.string().min(1, "Workflow ID is required").optional(),
    status: feedbackStatusEnum.optional(),
    type: feedbackTypeEnum.optional(),
    priority: feedbackPriorityEnum.optional(),
  })
  .optional();

const getFeedbackInputSchema = z.object({
  feedbackId: z.string().min(1, "Feedback ID is required"),
  workflowId: z.string().min(1).optional(),
});

const respondFeedbackInputSchema = z.object({
  feedbackId: z.string().min(1, "Feedback ID is required"),
  workflowId: z.string().min(1).optional(),
  response: feedbackResponseSchema.omit({ respondedAt: true }).extend({
    respondedAt: z.coerce.date().optional(),
  }),
});
type RespondFeedbackInput = z.infer<typeof respondFeedbackInputSchema>;

const dismissFeedbackInputSchema = z.object({
  feedbackId: z.string().min(1, "Feedback ID is required"),
  workflowId: z.string().min(1).optional(),
});

const acknowledgeFeedbackInputSchema = z.object({
  feedbackId: z.string().min(1, "Feedback ID is required"),
  workflowId: z.string().min(1).optional(),
});

function getFeedbackManager(projectRoot: string): FeedbackManager {
  return new FeedbackManager(projectRoot);
}

export const feedbackRouter = router({
  list: publicProcedure
    .input(listFeedbackInputSchema)
    .query(async ({ ctx, input }) => {
      const manager = getFeedbackManager(ctx.projectRoot);
      return manager.list(input ?? {});
    }),

  get: publicProcedure
    .input(getFeedbackInputSchema)
    .query(async ({ ctx, input }) => {
      const manager = getFeedbackManager(ctx.projectRoot);
      const feedback = await manager.get(input.feedbackId, input.workflowId);

      if (!feedback) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Feedback not found: ${input.feedbackId}`,
        });
      }

      return feedback;
    }),

  respond: publicProcedure
    .input(respondFeedbackInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getFeedbackManager(ctx.projectRoot);
      const response: RespondFeedbackInput["response"] = {
        ...input.response,
        respondedAt: input.response.respondedAt ?? new Date(),
      };

      try {
        return await manager.respond(input.feedbackId, response, input.workflowId);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to respond",
        });
      }
    }),

  dismiss: publicProcedure
    .input(dismissFeedbackInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getFeedbackManager(ctx.projectRoot);

      try {
        return await manager.dismiss(input.feedbackId, input.workflowId);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to dismiss feedback",
        });
      }
    }),

  acknowledge: publicProcedure
    .input(acknowledgeFeedbackInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getFeedbackManager(ctx.projectRoot);

      try {
        return await manager.acknowledge(
          input.feedbackId,
          input.workflowId
        );
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Failed to acknowledge feedback",
        });
      }
    }),
});
