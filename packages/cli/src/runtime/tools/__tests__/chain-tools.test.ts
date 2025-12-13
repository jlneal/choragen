/**
 * @design-doc docs/adr/done/ADR-013-agent-tools-design.md
 * @test-type unit
 * @user-intent "Verify chain lifecycle tools approve and request changes correctly"
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { ChainManager } from "@choragen/core";
import { executeChainApprove, executeChainRequestChanges } from "../chain-tools.js";
import type { ExecutionContext } from "../executor.js";

const CHAIN_ID = "CHAIN-001-test";

describe("chain lifecycle tools", () => {
  let tempDir: string;
  let chainManager: ChainManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-chain-tools-"));
    chainManager = new ChainManager(tempDir);
    await chainManager.createChain({
      requestId: "CR-123",
      slug: "test",
      title: "Test Chain",
      description: "Chain for tool tests",
    });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("approves a chain and emits chain.approved", async () => {
    const emitEvent = vi.fn();
    const context: ExecutionContext = {
      role: "control",
      workspaceRoot: tempDir,
      eventEmitter: emitEvent,
    };

    const result = await executeChainApprove(
      { chainId: CHAIN_ID, reason: "All tasks validated" },
      context
    );

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      chainId: CHAIN_ID,
      title: "Test Chain",
      reason: "All tasks validated",
    });

    expect(emitEvent).toHaveBeenCalledWith({
      type: "chain.approved",
      payload: {
        chainId: CHAIN_ID,
        title: "Test Chain",
        reason: "All tasks validated",
      },
    });
  });

  it("requests changes on a chain and emits chain.changes_requested", async () => {
    const emitEvent = vi.fn();
    const context: ExecutionContext = {
      role: "control",
      workspaceRoot: tempDir,
      eventEmitter: emitEvent,
    };

    const result = await executeChainRequestChanges(
      { chainId: CHAIN_ID, reason: "Update risk assessment" },
      context
    );

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      chainId: CHAIN_ID,
      title: "Test Chain",
      reason: "Update risk assessment",
    });

    expect(emitEvent).toHaveBeenCalledWith({
      type: "chain.changes_requested",
      payload: {
        chainId: CHAIN_ID,
        title: "Test Chain",
        reason: "Update risk assessment",
      },
    });
  });
});
