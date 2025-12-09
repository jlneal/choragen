// ADR: ADR-011-web-api-architecture

/**
 * Config tRPC Router
 *
 * Exposes Choragen configuration from .choragen/config.yaml
 * and governance schema from choragen.governance.yaml.
 */
import * as fs from "fs/promises";
import * as path from "path";
import { parse as parseYaml } from "yaml";
import { router, publicProcedure, TRPCError } from "../trpc";

/**
 * Project configuration from .choragen/config.yaml
 */
interface ProjectConfig {
  project: {
    name: string;
    domain: string;
  };
  paths: {
    adr: string;
    design: string;
    requests: string;
    tasks: string;
  };
  domains: string[];
  governance: string;
}

/**
 * Governance rule with pattern and actions
 */
interface GovernanceRule {
  pattern: string;
  actions?: string[];
  reason?: string;
}

/**
 * Role-based access control configuration
 */
interface RoleConfig {
  allow?: GovernanceRule[];
  deny?: GovernanceRule[];
}

/**
 * Governance schema from choragen.governance.yaml
 */
interface GovernanceConfig {
  mutations: {
    allow?: GovernanceRule[];
    approve?: GovernanceRule[];
    deny?: GovernanceRule[];
  };
  collision_detection?: {
    strategy: string;
    on_collision: string;
  };
  roles?: {
    impl?: RoleConfig;
    control?: RoleConfig;
  };
  validation?: Record<string, unknown>;
}

/**
 * Helper to read and parse a YAML file
 */
async function readYamlFile<T>(filePath: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return parseYaml(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Configuration file not found: ${filePath}`,
      });
    }
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to parse configuration file: ${filePath}`,
      cause: error,
    });
  }
}

/**
 * Config router for accessing Choragen configuration
 */
export const configRouter = router({
  /**
   * Get project configuration from .choragen/config.yaml
   */
  getProject: publicProcedure.query(async ({ ctx }) => {
    const configPath = path.join(ctx.projectRoot, ".choragen", "config.yaml");
    return readYamlFile<ProjectConfig>(configPath);
  }),

  /**
   * Get governance schema from choragen.governance.yaml
   */
  getGovernance: publicProcedure.query(async ({ ctx }) => {
    // First read project config to get governance file path
    const projectConfigPath = path.join(
      ctx.projectRoot,
      ".choragen",
      "config.yaml"
    );

    let governanceFileName = "choragen.governance.yaml";

    try {
      const projectConfig = await readYamlFile<ProjectConfig>(projectConfigPath);
      if (projectConfig.governance) {
        governanceFileName = projectConfig.governance;
      }
    } catch {
      // Use default governance file name if project config is not available
    }

    const governancePath = path.join(ctx.projectRoot, governanceFileName);
    return readYamlFile<GovernanceConfig>(governancePath);
  }),

  /**
   * Get configured paths from project configuration
   */
  getPaths: publicProcedure.query(async ({ ctx }) => {
    const configPath = path.join(ctx.projectRoot, ".choragen", "config.yaml");
    const config = await readYamlFile<ProjectConfig>(configPath);

    return {
      adr: config.paths.adr,
      design: config.paths.design,
      requests: config.paths.requests,
      tasks: config.paths.tasks,
      // Include absolute paths for convenience
      absolute: {
        adr: path.join(ctx.projectRoot, config.paths.adr),
        design: path.join(ctx.projectRoot, config.paths.design),
        requests: path.join(ctx.projectRoot, config.paths.requests),
        tasks: path.join(ctx.projectRoot, config.paths.tasks),
      },
    };
  }),
});
