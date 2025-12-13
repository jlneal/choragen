/**
 * @design-doc docs/adr/done/ADR-013-agent-tools-design.md
 * @test-type unit
 * @user-intent "Verify request lifecycle tools create, approve, and request changes correctly"
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import {
  executeRequestCreate,
  executeRequestApprove,
  executeRequestChanges,
} from "../request-tools.js";
import type { ExecutionContext } from "../executor.js";

describe("request lifecycle tools", () => {
  let tempDir: string;
  let context: ExecutionContext;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-request-tools-"));
    context = {
      role: "control",
      workspaceRoot: tempDir,
    };
    // copy templates into temp workspace
    const templateDir = path.join(tempDir, "templates");
    await fs.mkdir(templateDir, { recursive: true });
    const projectTemplateDir = path.join(process.cwd(), "..", "..", "templates");
    await fs.copyFile(path.join(projectTemplateDir, "change-request.md"), path.join(templateDir, "change-request.md"));
    await fs.copyFile(path.join(projectTemplateDir, "fix-request.md"), path.join(templateDir, "fix-request.md"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("creates a change request in backlog and emits request.created", async () => {
    const emitEvent = vi.fn();
    const result = await executeRequestCreate(
      {
        type: "cr",
        title: "Improve logging",
        domain: "platform",
        content: "Need better logs",
      },
      { ...context, eventEmitter: emitEvent }
    );

    expect(result.success).toBe(true);
    const data = result.data as { requestId: string; path: string };
    expect(data.requestId).toMatch(/^CR-\d{8}-\d{3}$/);
    const filePath = path.join(tempDir, data.path);
    const fileContent = await fs.readFile(filePath, "utf-8");
    expect(fileContent).toContain("Improve logging");
    expect(fileContent).toContain("platform");
    expect(emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "request.created",
        payload: expect.objectContaining({ requestId: data.requestId }),
      })
    );
  });

  it("approves a request and emits request.approved", async () => {
    // Seed a request file
    const requestId = "CR-20250101-001";
    const requestDir = path.join(tempDir, "docs/requests/change-requests/backlog");
    await fs.mkdir(requestDir, { recursive: true });
    const requestPath = path.join(requestDir, `${requestId}-demo.md`);
    await fs.writeFile(requestPath, "demo");

    const emitEvent = vi.fn();
    const result = await executeRequestApprove(
      { requestId, reason: "Looks good" },
      { ...context, eventEmitter: emitEvent }
    );

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      requestId,
      path: path.relative(tempDir, requestPath),
      reason: "Looks good",
    });
    expect(emitEvent).toHaveBeenCalledWith({
      type: "request.approved",
      payload: { requestId, reason: "Looks good" },
    });
  });

  it("requests changes on a request and emits request.changes_requested", async () => {
    // Seed a fix request file
    const requestId = "FR-20250101-002";
    const requestDir = path.join(tempDir, "docs/requests/fix-requests/in-review");
    await fs.mkdir(requestDir, { recursive: true });
    const requestPath = path.join(requestDir, `${requestId}-demo.md`);
    await fs.writeFile(requestPath, "demo");

    const emitEvent = vi.fn();
    const result = await executeRequestChanges(
      { requestId, reason: "Missing RCA" },
      { ...context, eventEmitter: emitEvent }
    );

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      requestId,
      path: path.relative(tempDir, requestPath),
      reason: "Missing RCA",
    });
    expect(emitEvent).toHaveBeenCalledWith({
      type: "request.changes_requested",
      payload: { requestId, reason: "Missing RCA" },
    });
  });
});
