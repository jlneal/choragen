// ADR: ADR-011-web-api-architecture

/**
 * Tool Metadata tRPC Router
 *
 * Exposes ToolMetadataExtractor for listing tools, categories, and syncing from code.
 * Tool metadata is stored in .choragen/tools/.
 */
import { router, publicProcedure, TRPCError } from "../trpc";
import {
  ToolMetadataExtractor,
  DEFAULT_TOOL_CATEGORIES,
  type ToolCategory,
} from "@choragen/core";
import { defaultRegistry } from "@choragen/cli/dist/runtime/index.js";

function getExtractor(projectRoot: string): ToolMetadataExtractor {
  return new ToolMetadataExtractor(projectRoot);
}

function getDefaultCategories(): ToolCategory[] {
  return DEFAULT_TOOL_CATEGORIES.map((category) => ({ ...category }));
}

export const toolRouter = router({
  /**
   * List tool metadata from the generated index
   */
  list: publicProcedure.query(async ({ ctx }) => {
    const extractor = getExtractor(ctx.projectRoot);
    return extractor.readIndex();
  }),

  /**
   * Get tool categories, falling back to defaults if none exist
   */
  getCategories: publicProcedure.query(async ({ ctx }) => {
    const extractor = getExtractor(ctx.projectRoot);
    const categories = await extractor.readCategories();

    if (categories.length > 0) {
      return categories;
    }

    const defaults = getDefaultCategories();
    await extractor.writeCategories(defaults);
    return defaults;
  }),

  /**
   * Sync tool metadata from code definitions
   */
  sync: publicProcedure.mutation(async ({ ctx }) => {
    const extractor = getExtractor(ctx.projectRoot);

    try {
      const tools = defaultRegistry.getAllTools();
      const metadata = extractor.extractFromRegistry(tools);
      const categories = getDefaultCategories();

      await extractor.writeIndex(metadata);
      await extractor.writeCategories(categories);

      return { success: true, toolCount: metadata.length };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to sync tool metadata",
      });
    }
  }),
});
