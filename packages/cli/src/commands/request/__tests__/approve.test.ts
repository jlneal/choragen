/**
 * @design-doc docs/design/core/features/standard-workflow.md
 * @test-type unit
 * @user-intent "Verify request approval command gates on approved chains"
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { ChainManager } from "@choragen/core";
import { approveRequestCommand } from "../approve.js";

describe("request:approve command", () => {
  let tempDir: string;
  let chainManager: ChainManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-request-approve-"));
    chainManager = new ChainManager(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function createRequestFile(requestId: string): Promise<string> {
    const dir = path.join(tempDir, "docs/requests/change-requests/doing");
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${requestId}-demo.md`);
    await fs.writeFile(
      filePath,
      `# Change Request\n\n**ID**: ${requestId}\n**Status**: doing\n`,
      "utf-8"
    );
    return filePath;
  }

  async function createApprovedChain(requestId: string, chainSlug: string) {
    const chain = await chainManager.createChain({
      requestId,
      slug: chainSlug,
      title: chainSlug,
    });
    await chainManager.updateChain(chain.id, { reviewStatus: "approved" });
    return chain;
  }

  it("approves a request and emits request:approved", async () => {
    const requestId = "CR-REQ-001";
    await createRequestFile(requestId);
    await createApprovedChain(requestId, "chain-a");
    await createApprovedChain(requestId, "chain-b");
    const emitEvent = vi.fn().mockResolvedValue(undefined);

    const result = await approveRequestCommand(
      { projectRoot: tempDir, chainManager, emitEvent },
      { requestId }
    );

    expect(result.success).toBe(true);
    expect(result.reviewStatus).toBe("approved");
    expect(result.requestPath).toContain(requestId);
    expect(emitEvent).toHaveBeenCalledWith({
      eventType: "request:approved",
      entityType: "request",
      entityId: requestId,
      metadata: {
        reviewStatus: "approved",
      },
    });

    const metaPath = path.join(tempDir, ".choragen/requests", `${requestId}.json`);
    const meta = JSON.parse(await fs.readFile(metaPath, "utf-8"));
    expect(meta.reviewStatus).toBe("approved");
  });

  it("fails when chains are not all approved", async () => {
    const requestId = "CR-REQ-002";
    await createRequestFile(requestId);
    const chain = await chainManager.createChain({
      requestId,
      slug: "chain-pending",
      title: "Chain Pending",
    });
    await chainManager.updateChain(chain.id, { reviewStatus: "changes_requested" });
    const emitEvent = vi.fn();

    const result = await approveRequestCommand(
      { projectRoot: tempDir, chainManager, emitEvent },
      { requestId }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("All chains must be approved");
    expect(emitEvent).not.toHaveBeenCalled();
  });
});
