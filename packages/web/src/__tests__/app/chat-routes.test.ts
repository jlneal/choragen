/**
 * @design-doc docs/design/core/features/web-chat-interface.md
 * @user-intent "Verify chat route helper functions for workflow selection and stage display"
 * @test-type unit
 */

import { describe, expect, it } from "vitest";
import { selectPrimaryWorkflow } from "@/lib/workflow-utils";
import { deriveStageSummary } from "@/app/chat/[workflowId]/chat-workflow-content";

describe("chat route helpers", () => {
  describe("selectPrimaryWorkflow", () => {
    it("returns the most recently updated workflow", () => {
      const EARLIER_TIMESTAMP = "2025-01-01T00:00:00Z";
      const LATEST_TIMESTAMP = "2025-01-02T12:00:00Z";
      const workflows = [
        { id: "WF-early", updatedAt: EARLIER_TIMESTAMP },
        { id: "WF-latest", updatedAt: LATEST_TIMESTAMP },
      ];

      const result = selectPrimaryWorkflow(workflows);

      expect(result?.id).toBe("WF-latest");
    });

    it("returns null when there are no workflows", () => {
      const workflows: { id: string; updatedAt?: string }[] = [];

      const result = selectPrimaryWorkflow(workflows);

      expect(result).toBeNull();
    });
  });

  describe("deriveStageSummary", () => {
    it("formats stage summary with zero-based index", () => {
      const CURRENT_STAGE_INDEX = 1;
      const TOTAL_STAGES = 3;
      const EXPECTED_LABEL = "Stage 2 of 3";

      const result = deriveStageSummary(CURRENT_STAGE_INDEX, TOTAL_STAGES);

      expect(result).toBe(EXPECTED_LABEL);
    });

    it("clamps negative stages and handles missing totals", () => {
      const NEGATIVE_STAGE = -1;
      const TOTAL_STAGES = 2;
      const EXPECTED_LABEL = "Stage 1 of 2";

      const negativeResult = deriveStageSummary(NEGATIVE_STAGE, TOTAL_STAGES);
      const missingTotalResult = deriveStageSummary(NEGATIVE_STAGE);

      expect(negativeResult).toBe(EXPECTED_LABEL);
      expect(missingTotalResult).toBe("No stages available");
    });
  });
});
