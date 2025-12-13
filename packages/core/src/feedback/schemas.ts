// ADR: ADR-011-workflow-orchestration
// Design doc: docs/design/core/features/agent-feedback.md

/**
 * Zod schemas for feedback validation
 *
 * Design doc: docs/design/core/features/agent-feedback.md
 */

import { z } from "zod";

import {
  FEEDBACK_PRIORITIES,
  FEEDBACK_STATUSES,
  FEEDBACK_TYPES,
  type FeedbackPriority,
  type FeedbackStatus,
  type FeedbackType,
} from "./types.js";

const nonEmptyString = (field: string) =>
  z
    .string({ required_error: `${field} is required` })
    .trim()
    .min(1, { message: `${field} is required` });

const dateSchema = (field: string) =>
  z
    .coerce.date({ required_error: `${field} is required` })
    .refine((value) => !Number.isNaN(value.getTime()), {
      message: `${field} must be a valid date`,
    });

const nonNegativeInteger = (field: string) =>
  z
    .number({ required_error: `${field} is required` })
    .refine(Number.isInteger, { message: `${field} must be an integer` })
    .refine((value) => value >= 0, {
      message: `${field} cannot be negative`,
    });

const positiveInteger = (field: string) =>
  z
    .number({ required_error: `${field} is required` })
    .refine(Number.isInteger, { message: `${field} must be an integer` })
    .refine((value) => value > 0, {
      message: `${field} must be greater than zero`,
    });

const enumErrorMap = (label: string, values: readonly string[]): z.ZodErrorMap =>
  (issue, ctx) => {
    if (issue.code === "invalid_enum_value") {
      return { message: `${label} must be one of: ${values.join(", ")}` };
    }

    if (issue.code === "invalid_type" && issue.received === "undefined") {
      return { message: `${label} is required` };
    }

    return { message: ctx.defaultError };
  };

const feedbackTypeValues: [FeedbackType, ...FeedbackType[]] = [
  ...FEEDBACK_TYPES,
];
const feedbackStatusValues: [FeedbackStatus, ...FeedbackStatus[]] = [
  ...FEEDBACK_STATUSES,
];
const feedbackPriorityValues: [FeedbackPriority, ...FeedbackPriority[]] = [
  ...FEEDBACK_PRIORITIES,
];

export const feedbackTypeSchema = z.enum(feedbackTypeValues, {
  errorMap: enumErrorMap("Feedback type", FEEDBACK_TYPES),
});

export const feedbackStatusSchema = z.enum(feedbackStatusValues, {
  errorMap: enumErrorMap("Feedback status", FEEDBACK_STATUSES),
});

export const feedbackPrioritySchema = z.enum(feedbackPriorityValues, {
  errorMap: enumErrorMap("Feedback priority", FEEDBACK_PRIORITIES),
});

export const feedbackCodeSnippetSchema = z
  .object({
    file: nonEmptyString("Snippet file path"),
    startLine: positiveInteger("Snippet start line"),
    endLine: positiveInteger("Snippet end line"),
    content: nonEmptyString("Snippet content"),
  })
  .refine((snippet) => snippet.endLine >= snippet.startLine, {
    message: "Snippet end line must be greater than or equal to start line",
    path: ["endLine"],
  });

export const feedbackOptionSchema = z.object({
  label: nonEmptyString("Option label"),
  description: nonEmptyString("Option description"),
  recommended: z.boolean().optional(),
});

export const feedbackContextSchema = z.object({
  files: z.array(nonEmptyString("File path")).optional(),
  codeSnippets: z.array(feedbackCodeSnippetSchema).optional(),
  options: z.array(feedbackOptionSchema).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const feedbackResponseSchema = z.object({
  content: nonEmptyString("Response content"),
  selectedOption: nonEmptyString("Selected option").optional(),
  respondedBy: nonEmptyString("Responder"),
  respondedAt: dateSchema("Responded at"),
});

export const feedbackItemSchema = z.object({
  id: nonEmptyString("Feedback ID"),
  workflowId: nonEmptyString("Workflow ID"),
  stageIndex: nonNegativeInteger("Stage index"),
  taskId: nonEmptyString("Task ID").optional(),
  chainId: nonEmptyString("Chain ID").optional(),
  type: feedbackTypeSchema,
  createdByRole: nonEmptyString("Creator role"),
  content: nonEmptyString("Feedback content"),
  context: feedbackContextSchema.optional(),
  status: feedbackStatusSchema,
  response: feedbackResponseSchema.optional(),
  priority: feedbackPrioritySchema,
  createdAt: dateSchema("Created at"),
  updatedAt: dateSchema("Updated at"),
  resolvedAt: dateSchema("Resolved at").optional(),
});

export type FeedbackItemInput = z.infer<typeof feedbackItemSchema>;
