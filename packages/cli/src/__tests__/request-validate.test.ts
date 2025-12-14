/**
 * @design-doc docs/design/core/features/standard-workflow.md
 * @test-type unit
 * @user-intent "Verify request validation catches incomplete requests before closure"
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { validateRequestForClosure } from "../commands/request-validate.js";

const REQUEST_ID = "CR-TEST-001";

interface RequestOptions {
  commits?: string[];
  completionNotes?: string;
  acceptanceCriteria?: string[];
  linkedAdrs?: string[];
  statusDir?: "todo" | "doing";
}

async function createBaseProject(rootDir: string, reviewStatus: "approved" | "changes_requested" = "approved"): Promise<void> {
  const dirs = [
    "docs/requests/change-requests/todo",
    "docs/requests/change-requests/doing",
    "docs/requests/fix-requests/todo",
    "docs/requests/fix-requests/doing",
    "docs/tasks/.chains",
  ];

  for (const dir of dirs) {
    await fs.mkdir(path.join(rootDir, dir), { recursive: true });
  }

  const chainMetaPath = path.join(rootDir, "docs/tasks/.chains/CHAIN-001-test.json");
  const chainMetadata = {
    id: "CHAIN-001-test",
    sequence: 1,
    slug: "test",
    requestId: REQUEST_ID,
    title: "Test Chain",
    description: "",
    reviewStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await fs.writeFile(chainMetaPath, JSON.stringify(chainMetadata, null, 2), "utf-8");
}

async function writeRequestFile(rootDir: string, options: RequestOptions = {}): Promise<string> {
  const commits = options.commits ?? ["abc123 Initial commit"];
  const completionNotes = options.completionNotes ?? "Completed work as planned.";
  const acceptance = options.acceptanceCriteria ?? ["- [x] Criteria satisfied"];
  const linkedAdrs = options.linkedAdrs ?? ["../../adr/done/ADR-001-task-file-format.md"];
  const statusDir = options.statusDir ?? "doing";

  const requestDir = path.join(rootDir, "docs/requests/change-requests", statusDir);
  const requestPath = path.join(requestDir, `${REQUEST_ID}-test.md`);

  const content = `# Change Request: Test Request

**ID**: ${REQUEST_ID}  
**Domain**: core  
**Status**: ${statusDir}  
**Created**: 2025-12-14  
**Owner**: tester  

---

## Commits

${commits.map((c) => `- ${c}`).join("\n")}

## Acceptance Criteria

${acceptance.join("\n")}

## Linked ADRs

${linkedAdrs.map((adr) => `- [ADR](${adr})`).join("\n")}

## Completion Notes

${completionNotes}
`;

  await fs.writeFile(requestPath, content, "utf-8");
  return requestPath;
}

describe("validateRequestForClosure", () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-request-validate-"));
    await createBaseProject(projectRoot);
  });

  afterEach(async () => {
    await fs.rm(projectRoot, { recursive: true, force: true });
  });

  it("fails when commits section is empty", async () => {
    await writeRequestFile(projectRoot, { commits: [] });

    const result = await validateRequestForClosure(projectRoot, REQUEST_ID);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Commits section is missing or not populated with real entries");
  });

  it("fails when completion notes are placeholder", async () => {
    await writeRequestFile(projectRoot, { completionNotes: "TODO" });

    const result = await validateRequestForClosure(projectRoot, REQUEST_ID);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Completion Notes section is missing or contains placeholder text");
  });

  it("fails when linked ADR is in todo/", async () => {
    await writeRequestFile(projectRoot, {
      linkedAdrs: ["../../adr/todo/ADR-999-sample.md"],
    });

    const result = await validateRequestForClosure(projectRoot, REQUEST_ID);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Linked ADRs must be in done/ or doing/"))).toBe(true);
  });

  it("fails when linked chain is not approved", async () => {
    // Recreate project with a non-approved chain
    await fs.rm(projectRoot, { recursive: true, force: true });
    projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "choragen-request-validate-"));
    await createBaseProject(projectRoot, "changes_requested");
    await writeRequestFile(projectRoot);

    const result = await validateRequestForClosure(projectRoot, REQUEST_ID);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("All chains must be approved before closure"))).toBe(true);
  });

  it("fails when acceptance criteria are unchecked", async () => {
    await writeRequestFile(projectRoot, {
      acceptanceCriteria: ["- [ ] Pending item"],
    });

    const result = await validateRequestForClosure(projectRoot, REQUEST_ID);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("1 acceptance criteria unchecked");
  });

  it("passes when all criteria are met", async () => {
    await writeRequestFile(projectRoot);

    const result = await validateRequestForClosure(projectRoot, REQUEST_ID);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
