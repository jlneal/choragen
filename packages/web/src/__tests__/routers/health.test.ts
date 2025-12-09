/**
 * @design-doc docs/design/core/features/web-api.md
 * @user-intent "Verify health check endpoint returns correct status and timestamp"
 * @test-type unit
 */

import { describe, it, expect } from "vitest";
import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers";

describe("health router", () => {
  const createCaller = createCallerFactory(appRouter);

  describe("health", () => {
    it("returns ok status", async () => {
      const caller = createCaller({ projectRoot: "/tmp/test" });
      const result = await caller.health();

      expect(result.status).toBe("ok");
    });

    it("returns a valid timestamp", async () => {
      const caller = createCaller({ projectRoot: "/tmp/test" });
      const result = await caller.health();

      expect(result.timestamp).toBeDefined();
      // Verify it's a valid ISO timestamp
      const date = new Date(result.timestamp);
      expect(date.toISOString()).toBe(result.timestamp);
    });
  });
});
