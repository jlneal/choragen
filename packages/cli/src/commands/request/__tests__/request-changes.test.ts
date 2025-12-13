/**
 * @design-doc docs/design/core/features/standard-workflow.md
 * @test-type unit
 * @user-intent "Verify request change request command validates chains and reason"
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { ChainManager } from "@choragen/core";
import { requestChangesCommand } from "../request-changes.js";

describe("request:request_changes command", () => {
  let tempDir: string;
  let chainManager: ChainManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-request-changes-"));
    chainManager = new ChainManager(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function createRequestFile(requestId: string): Promise<void> {
    const dir = path.join(tempDir, "docs/requests/change-requests/doing");
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${requestId}-demo.md`);
    await fs.writeFile(
      filePath,
      `# Change Request\n\n**ID**: ${requestId}\n**Status**: doing\n`,
      "utf-8"
    );
  }

  async function createApprovedChain(requestId: string, slug: string) {
    const chain = await chainManager.createChain({
      requestId,
      slug,
      title: slug,
    });
    await chainManager.updateChain(chain.id, { reviewStatus: "approved" });
    return chain;
  }

  it("requests changes on a request and emits request:changes_requested", async () => {
    const requestId = "CR-REQ-003";
    await createRequestFile(requestId);
    await createApprovedChain(requestId, "chain-a");
    await createApprovedChain(requestId, "chain-b");
    const emitEvent = vi.fn().mockResolvedValue(undefined);
    const reason = "Add missing ADR reference";

    const result = await requestChangesCommand(
      { projectRoot: tempDir, chainManager, emitEvent },
      { requestId, reason }
    );

    expect(result.success).toBe(true);
    expect(result.reviewStatus).toBe("changes_requested");
    expect(result.requestPath).toContain(requestId);

    const metaPath = path.join(tempDir, ".choragen/requests", `${requestId}.json`);
    const meta = JSON.parse(await fs.readFile(metaPath, "utf-8"));
    expect(meta.reviewStatus).toBe("changes_requested");
    expect(meta.reason).toBe(reason);

    expect(emitEvent).toHaveBeenCalledWith({
      eventType: "request:changes_requested",
      entityType: "request",
      entityId: requestId,
      metadata: {
        reviewStatus: "changes_requested",
        reason,
      },
    });
  });

  it("fails when chains are not all approved", async () => {
    const requestId = "CR-REQ-004";
    await createRequestFile(requestId);
    const chain = await chainManager.createChain({
      requestId,
      slug: "chain-pending",
      title: "Chain Pending",
    });
    await chainManager.updateChain(chain.id, { reviewStatus: "changes_requested" });
    const emitEvent = vi.fn();

    const result = await requestChangesCommand(
      { projectRoot: tempDir, chainManager, emitEvent },
      { requestId, reason: "Need fixes" }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("All chains must be approved");
    expect(emitEvent).not.toHaveBeenCalled();
  });

  it("fails when reason is missing", async () => {
    const requestId = "CR-REQ-005";
    await createRequestFile(requestId);
    await createApprovedChain(requestId, "chain-a");
    const emitEvent = vi.fn();

    const result = await requestChangesCommand(
      { projectRoot: tempDir, chainManager, emitEvent },
      { requestId, reason: "" }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Reason is required");
    expect(emitEvent).not.toHaveBeenCalled();
  });
});
