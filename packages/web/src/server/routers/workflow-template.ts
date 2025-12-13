// ADR: ADR-011-web-api-architecture

/**
 * Workflow Template tRPC Router
 *
 * Exposes TemplateManager from @choragen/core to the web dashboard.
 * Provides CRUD operations, duplication, and version history/restore flows.
 */
import { z } from "zod";
import { router, publicProcedure, TRPCError } from "../trpc";
import {
  TemplateManager,
  STAGE_TYPES,
  GATE_TYPES,
  type GateType,
  type StageType,
  type TemplateVersion,
  type WorkflowTemplate,
  type WorkflowTemplateStage,
} from "@choragen/core";

const stageTypeEnum = z.enum(
  STAGE_TYPES as [StageType, ...StageType[]]
);

const gateTypeEnum = z.enum(
  GATE_TYPES as [GateType, ...GateType[]]
);

const transitionActionSchema = z
  .object({
    type: z.enum([
      "command",
      "task_transition",
      "file_move",
      "custom",
      "spawn_agent",
      "post_message",
      "emit_event",
    ]),
    command: z.string().optional(),
    taskTransition: z.enum(["start", "complete", "approve"]).optional(),
    fileMove: z
      .object({
        from: z.string(),
        to: z.string(),
      })
      .optional(),
    handler: z.string().optional(),
    blocking: z.boolean().optional(),
    role: z.string().optional(),
    context: z.record(z.unknown()).optional(),
    target: z.string().optional(),
    content: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    eventType: z.string().optional(),
    payload: z.record(z.unknown()).optional(),
  })
  .superRefine((action, ctx) => {
    if (action.type === "command" && !action.command) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "command is required when type is command",
        path: ["command"],
      });
    }
    if (action.type === "task_transition" && !action.taskTransition) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "taskTransition is required when type is task_transition",
        path: ["taskTransition"],
      });
    }
    if (action.type === "file_move" && !action.fileMove) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fileMove is required when type is file_move",
        path: ["fileMove"],
      });
    }
    if (action.type === "spawn_agent" && !action.role) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "role is required when type is spawn_agent",
        path: ["role"],
      });
    }
    if (action.type === "post_message" && !action.target) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "target is required when type is post_message",
        path: ["target"],
      });
    }
    if (action.type === "post_message" && !action.content) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "content is required when type is post_message",
        path: ["content"],
      });
    }
    if (action.type === "emit_event" && !action.eventType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "eventType is required when type is emit_event",
        path: ["eventType"],
      });
    }
  });

const hooksSchema = z
  .object({
    onEnter: z.array(transitionActionSchema).optional(),
    onExit: z.array(transitionActionSchema).optional(),
  })
  .optional();

const gateSchema = z
  .object({
    type: gateTypeEnum,
    prompt: z.string().optional(),
    chainId: z.string().optional(),
    commands: z.array(z.string()).optional(),
    satisfied: z.boolean().optional(),
    satisfiedBy: z.string().optional(),
    satisfiedAt: z.string().optional(),
  })
  .superRefine((gate, ctx) => {
    if (
      gate.type === "verification_pass" &&
      (!gate.commands || gate.commands.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "commands are required for verification_pass gates",
        path: ["commands"],
      });
    }
  });

const templateStageSchema = z.object({
  name: z.string().min(1, "Stage name is required"),
  type: stageTypeEnum,
  roleId: z.string().optional(),
  chainId: z.string().optional(),
  sessionId: z.string().optional(),
  gate: gateSchema,
  hooks: hooksSchema,
});

const templateBaseSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  displayName: z.string().optional(),
  description: z.string().optional(),
  stages: z
    .array(templateStageSchema)
    .min(1, "At least one stage is required"),
});

const createTemplateInputSchema = templateBaseSchema.extend({
  changedBy: z.string().optional(),
  changeDescription: z.string().optional(),
});

const updateTemplateInputSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  displayName: z.string().optional(),
  description: z.string().optional(),
  stages: z
    .array(templateStageSchema)
    .min(1, "At least one stage is required")
    .optional(),
  changedBy: z.string().optional(),
  changeDescription: z.string().optional(),
});

const deleteTemplateInputSchema = z.object({
  name: z.string().min(1, "Template name is required"),
});

const duplicateTemplateInputSchema = z.object({
  sourceName: z.string().min(1, "Source template name is required"),
  newName: z.string().min(1, "New template name is required"),
  changedBy: z.string().optional(),
  changeDescription: z.string().optional(),
});

const listVersionsInputSchema = z.object({
  name: z.string().min(1, "Template name is required"),
});

const getVersionInputSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  version: z.number().int().min(1, "Version must be at least 1"),
});

const restoreVersionInputSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  version: z.number().int().min(1, "Version must be at least 1"),
  changedBy: z.string().min(1, "Changed by is required"),
  changeDescription: z.string().optional(),
});

type TemplateStageInput = z.infer<typeof templateStageSchema>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- type alias kept for documentation
type CreateTemplateInput = z.infer<typeof createTemplateInputSchema>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- type alias kept for documentation
type UpdateTemplateInput = z.infer<typeof updateTemplateInputSchema>;

type SerializedWorkflowTemplateStage = Omit<WorkflowTemplateStage, "gate"> & {
  gate: Omit<WorkflowTemplateStage["gate"], "satisfiedAt"> & {
    satisfiedAt?: string;
  };
};

type SerializedWorkflowTemplate = Omit<
  WorkflowTemplate,
  "createdAt" | "updatedAt" | "stages"
> & {
  createdAt: string;
  updatedAt: string;
  stages: SerializedWorkflowTemplateStage[];
};

type SerializedTemplateVersion = Omit<TemplateVersion, "createdAt" | "snapshot"> & {
  createdAt: string;
  snapshot: SerializedWorkflowTemplate;
};

function getTemplateManager(projectRoot: string): TemplateManager {
  return new TemplateManager(projectRoot);
}

function toWorkflowTemplateStage(stage: TemplateStageInput): WorkflowTemplateStage {
  return {
    ...stage,
    gate: {
      ...stage.gate,
      satisfiedAt: stage.gate.satisfiedAt
        ? new Date(stage.gate.satisfiedAt)
        : undefined,
    },
    hooks: stage.hooks as WorkflowTemplateStage["hooks"],
  };
}

function serializeTemplateStage(
  stage: WorkflowTemplateStage
): SerializedWorkflowTemplateStage {
  return {
    ...stage,
    gate: {
      ...stage.gate,
      satisfiedAt: stage.gate.satisfiedAt
        ? stage.gate.satisfiedAt.toISOString()
        : undefined,
    },
  };
}

function serializeTemplate(template: WorkflowTemplate): SerializedWorkflowTemplate {
  return {
    ...template,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
    stages: template.stages.map(serializeTemplateStage),
  };
}

function serializeTemplateVersion(
  version: TemplateVersion
): SerializedTemplateVersion {
  return {
    ...version,
    createdAt: version.createdAt.toISOString(),
    snapshot: serializeTemplate(version.snapshot),
  };
}

function handleTemplateError(error: unknown, fallbackMessage: string): never {
  if (error instanceof Error) {
    const message = error.message;
    const isNotFound = message.toLowerCase().includes("not found");
    throw new TRPCError({
      code: isNotFound ? "NOT_FOUND" : "BAD_REQUEST",
      message,
    });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: fallbackMessage,
  });
}

/**
 * Workflow template router exposing TemplateManager operations.
 */
export const workflowTemplateRouter = router({
  /**
   * List all templates (built-in + custom)
   */
  list: publicProcedure.query(async ({ ctx }) => {
    const manager = getTemplateManager(ctx.projectRoot);
    const templates = await manager.list();
    return templates.map(serializeTemplate);
  }),

  /**
   * Get a single template by name
   */
  get: publicProcedure
    .input(deleteTemplateInputSchema)
    .query(async ({ ctx, input }) => {
      const manager = getTemplateManager(ctx.projectRoot);
      try {
        const template = await manager.get(input.name);
        return serializeTemplate(template);
      } catch (error) {
        return handleTemplateError(error, `Failed to get template ${input.name}`);
      }
    }),

  /**
   * Create a new custom template (version 1)
   */
  create: publicProcedure
    .input(createTemplateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getTemplateManager(ctx.projectRoot);
      const { changedBy, changeDescription, ...templateInput } = input;
      const now = new Date();
      const template: WorkflowTemplate = {
        ...templateInput,
        builtin: false,
        version: 1,
        createdAt: now,
        updatedAt: now,
        stages: templateInput.stages.map(toWorkflowTemplateStage),
      };

      try {
        const created = await manager.create(template, {
          changedBy,
          changeDescription,
        });
        return serializeTemplate(created);
      } catch (error) {
        return handleTemplateError(error, "Failed to create template");
      }
    }),

  /**
   * Update an existing template (increments version)
   */
  update: publicProcedure
    .input(updateTemplateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getTemplateManager(ctx.projectRoot);
      const { name, changedBy, changeDescription, ...changes } = input;

      const updatePayload: Partial<WorkflowTemplate> = {
        ...("displayName" in changes ? { displayName: changes.displayName } : {}),
        ...("description" in changes ? { description: changes.description } : {}),
        ...(changes.stages
          ? { stages: changes.stages.map(toWorkflowTemplateStage) }
          : {}),
      };

      try {
        const updated = await manager.update(name, updatePayload, {
          changedBy,
          changeDescription,
        });
        return serializeTemplate(updated);
      } catch (error) {
        return handleTemplateError(error, `Failed to update template ${name}`);
      }
    }),

  /**
   * Delete a custom template (errors on built-in)
   */
  delete: publicProcedure
    .input(deleteTemplateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getTemplateManager(ctx.projectRoot);
      try {
        await manager.delete(input.name);
        return { success: true, name: input.name };
      } catch (error) {
        return handleTemplateError(error, `Failed to delete template ${input.name}`);
      }
    }),

  /**
   * Duplicate a template to a new name
   */
  duplicate: publicProcedure
    .input(duplicateTemplateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getTemplateManager(ctx.projectRoot);
      const { changedBy, changeDescription, ...duplicateInput } = input;
      try {
        const duplicated = await manager.duplicate(
          duplicateInput.sourceName,
          duplicateInput.newName,
          {
            changedBy,
            changeDescription,
          }
        );
        return serializeTemplate(duplicated);
      } catch (error) {
        return handleTemplateError(
          error,
          `Failed to duplicate template ${input.sourceName}`
        );
      }
    }),

  /**
   * List all versions for a template
   */
  listVersions: publicProcedure
    .input(listVersionsInputSchema)
    .query(async ({ ctx, input }) => {
      const manager = getTemplateManager(ctx.projectRoot);
      try {
        const versions = await manager.listVersions(input.name);
        return versions.map(serializeTemplateVersion);
      } catch (error) {
        return handleTemplateError(
          error,
          `Failed to list versions for template ${input.name}`
        );
      }
    }),

  /**
   * Get a specific template version
   */
  getVersion: publicProcedure
    .input(getVersionInputSchema)
    .query(async ({ ctx, input }) => {
      const manager = getTemplateManager(ctx.projectRoot);
      try {
        const version = await manager.getVersion(input.name, input.version);
        return serializeTemplateVersion(version);
      } catch (error) {
        return handleTemplateError(
          error,
          `Failed to get version ${input.version} for template ${input.name}`
        );
      }
    }),

  /**
   * Restore a previous version as a new version
   */
  restoreVersion: publicProcedure
    .input(restoreVersionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const manager = getTemplateManager(ctx.projectRoot);
      try {
        const restored = await manager.restoreVersion(
          input.name,
          input.version,
          input.changedBy,
          input.changeDescription
        );
        return serializeTemplate(restored);
      } catch (error) {
        return handleTemplateError(
          error,
          `Failed to restore version ${input.version} for template ${input.name}`
        );
      }
    }),
});
