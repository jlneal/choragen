// ADR: ADR-013-agent-tools-design

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { ToolResult, type ExecutionContext } from "./executor.js";
import type { ToolDefinition } from "./types.js";

type RequestType = "cr" | "fr";

const REQUEST_CONFIG: Record<
  RequestType,
  { prefix: "CR" | "FR"; template: string; dir: string }
> = {
  cr: {
    prefix: "CR",
    template: "templates/change-request.md",
    dir: "change-requests",
  },
  fr: {
    prefix: "FR",
    template: "templates/fix-request.md",
    dir: "fix-requests",
  },
};

async function emitRequestEvent(
  context: ExecutionContext,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  if (!context.eventEmitter) return;
  try {
    await context.eventEmitter({ type: eventType, payload });
  } catch {
    // Event emission failures should not block tool execution
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDateParts(now: Date): { dateStr: string; formatted: string } {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return {
    dateStr: `${year}${month}${day}`,
    formatted: `${year}-${month}-${day}`,
  };
}

async function findNextSequence(
  workspaceRoot: string,
  reqType: RequestType,
  dateStr: string
): Promise<string> {
  const { prefix, dir } = REQUEST_CONFIG[reqType];
  const baseDir = path.join(workspaceRoot, "docs/requests", dir);
  let maxSeq = 0;

  try {
    const statuses = await fs.readdir(baseDir, { withFileTypes: true });
    for (const statusEntry of statuses) {
      if (!statusEntry.isDirectory()) continue;
      const statusDir = path.join(baseDir, statusEntry.name);
      const files = await fs.readdir(statusDir);
      for (const file of files) {
        const match = file.match(new RegExp(`^${prefix}-${dateStr}-(\\d{3})`));
        if (match) {
          const seqNum = parseInt(match[1], 10);
          if (!Number.isNaN(seqNum)) {
            maxSeq = Math.max(maxSeq, seqNum);
          }
        }
      }
    }
  } catch {
    // Directory may not exist yet; will be created later
  }

  const nextSeq = maxSeq + 1;
  return String(nextSeq).padStart(3, "0");
}

async function loadTemplate(workspaceRoot: string, relativePath: string): Promise<string> {
  const templatePath = path.join(workspaceRoot, relativePath);
  return fs.readFile(templatePath, "utf-8");
}

function replacePlaceholders(content: string, values: Record<string, string>): string {
  return content.replace(/{{\s*([A-Z0-9_]+)\s*}}/g, (_, key: string) => {
    return values[key] ?? "TBD";
  });
}

async function findRequestPath(
  workspaceRoot: string,
  requestId: string
): Promise<string | null> {
  const reqType: RequestType | null = requestId.startsWith("CR-")
    ? "cr"
    : requestId.startsWith("FR-")
    ? "fr"
    : null;
  if (!reqType) return null;

  const { dir } = REQUEST_CONFIG[reqType];
  const baseDir = path.join(workspaceRoot, "docs/requests", dir);

  try {
    const statuses = await fs.readdir(baseDir, { withFileTypes: true });
    for (const statusEntry of statuses) {
      if (!statusEntry.isDirectory()) continue;
      const statusDir = path.join(baseDir, statusEntry.name);
      const files = await fs.readdir(statusDir);
      const match = files.find((file) => file.startsWith(requestId));
      if (match) {
        return path.join(statusDir, match);
      }
    }
  } catch {
    return null;
  }

  return null;
}

export const requestCreateTool: ToolDefinition = {
  name: "request:create",
  description: "Create a new change or fix request in backlog",
  parameters: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["cr", "fr"],
        description: "Request type: cr (change request) or fr (fix request)",
      },
      title: {
        type: "string",
        description: "Title of the request",
      },
      domain: {
        type: "string",
        description: "Domain or area the request impacts",
      },
      content: {
        type: "string",
        description: "Primary description or body content for the request",
      },
    },
    required: ["type", "title", "domain", "content"],
  },
  category: "request",
  mutates: true,
};

export async function executeRequestCreate(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const type = params.type as RequestType;
  const title = params.title as string;
  const domain = params.domain as string;
  const content = params.content as string;

  if (!type || (type !== "cr" && type !== "fr")) {
    return { success: false, error: "Invalid or missing parameter: type" };
  }
  if (!title) return { success: false, error: "Missing required parameter: title" };
  if (!domain) return { success: false, error: "Missing required parameter: domain" };
  if (!content) return { success: false, error: "Missing required parameter: content" };

  const config = REQUEST_CONFIG[type];
  const now = new Date();
  const { dateStr, formatted } = formatDateParts(now);
  const seq = await findNextSequence(context.workspaceRoot, type, dateStr);
  const requestId = `${config.prefix}-${dateStr}-${seq}`;
  const slug = slugify(title) || "request";

  const template = await loadTemplate(context.workspaceRoot, config.template);

  const baseValues: Record<string, string> =
    type === "cr"
      ? {
          TITLE: title,
          DATE: dateStr,
          SEQ: seq,
          DOMAIN: domain,
          DATE_FORMATTED: formatted,
          OWNER: "Unassigned",
          DESCRIPTION: content,
          MOTIVATION: content,
          IN_SCOPE_1: content,
          IN_SCOPE_2: "TBD",
          OUT_OF_SCOPE_1: "TBD",
          FEATURE_DOC_1: "TBD",
          DESIGN_DOC_2: "TBD",
          ADR_1: "TBD",
          NOTES: content,
        }
      : {
          TITLE: title,
          DATE: dateStr,
          SEQ: seq,
          DOMAIN: domain,
          DATE_FORMATTED: formatted,
          SEVERITY: "TBD",
          OWNER: "Unassigned",
          PROBLEM_DESCRIPTION: content,
          EXPECTED: content,
          ACTUAL: content,
          STEP_1: "TBD",
          STEP_2: "TBD",
          STEP_3: "TBD",
          ROOT_CAUSE: "TBD",
          PROPOSED_FIX: content,
          FILE_1: "TBD",
          ADR_1: "TBD",
        };

  const body = replacePlaceholders(template, baseValues);

  const backlogDir = path.join(context.workspaceRoot, "docs/requests", config.dir, "backlog");
  await fs.mkdir(backlogDir, { recursive: true });
  const fileName = `${requestId}-${slug}.md`;
  const filePath = path.join(backlogDir, fileName);

  await fs.writeFile(filePath, body, "utf-8");

  await emitRequestEvent(context, "request.created", {
    requestId,
    type,
    title,
    domain,
    path: path.relative(context.workspaceRoot, filePath),
  });

  return {
    success: true,
    data: {
      requestId,
      type,
      title,
      domain,
      path: path.relative(context.workspaceRoot, filePath),
    },
  };
}

export const requestApproveTool: ToolDefinition = {
  name: "request:approve",
  description: "Approve a request after review",
  parameters: {
    type: "object",
    properties: {
      requestId: {
        type: "string",
        description: "Request ID (e.g., CR-20251211-001)",
      },
      reason: {
        type: "string",
        description: "Optional approval note",
      },
    },
    required: ["requestId"],
  },
  category: "request",
  mutates: true,
};

export async function executeRequestApprove(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const requestId = params.requestId as string;
  const reason = params.reason as string | undefined;

  if (!requestId) {
    return { success: false, error: "Missing required parameter: requestId" };
  }

  const requestPath = await findRequestPath(context.workspaceRoot, requestId);
  if (!requestPath) {
    return { success: false, error: `Request not found: ${requestId}` };
  }

  await emitRequestEvent(context, "request.approved", { requestId, reason: reason ?? null });

  return {
    success: true,
    data: {
      requestId,
      path: path.relative(context.workspaceRoot, requestPath),
      reason: reason ?? null,
    },
  };
}

export const requestChangesTool: ToolDefinition = {
  name: "request:request_changes",
  description: "Request changes on a request during review",
  parameters: {
    type: "object",
    properties: {
      requestId: {
        type: "string",
        description: "Request ID (e.g., CR-20251211-001)",
      },
      reason: {
        type: "string",
        description: "Reason for requesting changes",
      },
    },
    required: ["requestId", "reason"],
  },
  category: "request",
  mutates: true,
};

export async function executeRequestChanges(
  params: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const requestId = params.requestId as string;
  const reason = params.reason as string | undefined;

  if (!requestId) {
    return { success: false, error: "Missing required parameter: requestId" };
  }

  if (!reason) {
    return { success: false, error: "Missing required parameter: reason" };
  }

  const requestPath = await findRequestPath(context.workspaceRoot, requestId);
  if (!requestPath) {
    return { success: false, error: `Request not found: ${requestId}` };
  }

  await emitRequestEvent(context, "request.changes_requested", { requestId, reason });

  return {
    success: true,
    data: {
      requestId,
      path: path.relative(context.workspaceRoot, requestPath),
      reason,
    },
  };
}
