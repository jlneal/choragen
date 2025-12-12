// ADR: ADR-011-web-api-architecture

/**
 * Root tRPC router exports.
 * Re-exported to keep import paths stable for server/client codegen.
 */
export { appRouter, type AppRouter } from "./routers";
