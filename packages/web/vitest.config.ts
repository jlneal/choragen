// ADR: ADR-011-web-api-architecture

/**
 * Vitest Configuration for @choragen/web
 *
 * Configures Vitest for testing tRPC routers with proper path aliases.
 */
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
