// ADR: ADR-011-web-api-architecture

/**
 * Root tRPC Router
 *
 * Combines all sub-routers into the main appRouter.
 * This is the entry point for all tRPC procedures.
 */
import { router, publicProcedure } from "../trpc";
import { chainsRouter } from "./chains";
import { tasksRouter } from "./tasks";
import { requestsRouter } from "./requests";
import { tagsRouter } from "./tags";
import { groupsRouter } from "./groups";
import { backlogRouter } from "./backlog";
import { sessionsRouter } from "./sessions";
import { metricsRouter } from "./metrics";
import { configRouter } from "./config";
import { gitRouter } from "./git";
import { projectRouter } from "./project";
import { workflowRouter } from "./workflow";
import { workflowTemplateRouter } from "./workflow-template";
import { settingsRouter } from "./settings";
import { roleRouter } from "./role";
import { toolRouter } from "./tool";
import { feedbackRouter } from "./feedback";
import { providersRouter } from "./providers";

/**
 * Root application router.
 * Combines all sub-routers into a single entry point.
 */
export const appRouter = router({
  /**
   * Health check procedure.
   * Useful for verifying the API is running.
   */
  health: publicProcedure.query(() => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Chain management router.
   * Full CRUD operations for task chains.
   */
  chains: chainsRouter,

  /**
   * Task management router.
   * Full CRUD operations and status transitions for tasks.
   */
  tasks: tasksRouter,

  /**
   * Request management router.
   * File-based operations for Change Requests (CR) and Fix Requests (FR).
   */
  requests: requestsRouter,

  /**
   * Tags router.
   * Tag management for requests (list, rename).
   */
  tags: tagsRouter,

  /**
   * Groups router.
   * Group management for organizing related requests.
   */
  groups: groupsRouter,

  /**
   * Backlog router.
   * Backlog sequencing with universal rank ordering.
   */
  backlog: backlogRouter,

  /**
   * Sessions router.
   * Agent session state derived from active locks.
   */
  sessions: sessionsRouter,

  /**
   * Metrics router.
   * Pipeline metrics from MetricsCollector.
   */
  metrics: metricsRouter,

  /**
   * Config router.
   * Project and governance configuration from YAML files.
   */
  config: configRouter,

  /**
   * Project router.
   * Validate and switch between Choragen projects.
   */
  project: projectRouter,

  /**
   * Git router.
   * Git status, staging, committing, and history.
   */
  git: gitRouter,

  /**
   * Workflow router.
   * Exposes workflow orchestration APIs.
   */
  workflow: workflowRouter,

  /**
   * Workflow template router.
   * CRUD + versioning for workflow templates.
   */
  workflowTemplates: workflowTemplateRouter,

  /**
   * Settings router.
   * Provider configuration and connection testing.
   */
  settings: settingsRouter,

  /**
   * Role router.
   * Role CRUD operations for role-based tool access.
   */
  roles: roleRouter,

  /**
   * Tool router.
   * Tool metadata and sync from code definitions.
   */
  tools: toolRouter,

  /**
   * Feedback router.
   * Feedback lifecycle operations for workflows.
   */
  feedback: feedbackRouter,

  /**
   * Providers router.
   * Lists available models for configured providers.
   */
  providers: providersRouter,
});

/**
 * Type definition for the root router.
 * Export this for use in the tRPC client.
 */
export type AppRouter = typeof appRouter;

export { roleRouter } from "./role";
export { toolRouter } from "./tool";
