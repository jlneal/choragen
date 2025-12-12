// ADR: ADR-010-agent-runtime-architecture

/**
 * Sync tool metadata to .choragen/tools
 */

import * as path from "node:path";
import {
  ToolMetadataExtractor,
  DEFAULT_TOOL_CATEGORIES,
  type ToolCategory,
} from "@choragen/core";
import { defaultRegistry } from "../../runtime/tools/registry.js";

export interface ToolsSyncResult {
  success: boolean;
  toolCount: number;
  indexPath: string;
  categoriesPath: string;
  error?: string;
}

export interface ToolsSyncOptions {
  json?: boolean;
}

/**
 * Generate tool metadata index and categories files.
 */
export async function syncTools(
  projectRoot: string,
  options: ToolsSyncOptions = {}
): Promise<ToolsSyncResult> {
  const extractor = new ToolMetadataExtractor(projectRoot);
  const tools = defaultRegistry.getAllTools();
  const metadata = extractor.extractFromRegistry(tools);

  await extractor.writeIndex(metadata);
  const categories: ToolCategory[] = DEFAULT_TOOL_CATEGORIES.map((category) => ({
    ...category,
  }));
  await extractor.writeCategories(categories);

  const indexPath = path.join(".choragen", "tools", "index.yaml");
  const categoriesPath = path.join(".choragen", "tools", "categories.yaml");

  if (!options.json) {
    console.log("Syncing tool metadata...");
    console.log(`Found ${metadata.length} tools`);
    console.log(`Wrote ${indexPath}`);
    console.log(`Wrote ${categoriesPath}`);
    console.log("Done.");
  }

  return {
    success: true,
    toolCount: metadata.length,
    indexPath,
    categoriesPath,
  };
}
