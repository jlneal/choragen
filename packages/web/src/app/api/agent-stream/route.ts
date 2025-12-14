// ADR: ADR-010-agent-runtime-architecture
// Design doc: docs/design/core/features/agent-runtime.md

import { spawnAgentSession, type AgentSession } from "@/lib/agent-subprocess";
import { WorkflowManager } from "@choragen/core";
import { DesignContract, HttpStatus } from "@choragen/contracts";
import * as path from "node:path";
import * as fs from "node:fs/promises";

const DEFAULT_STAGE_INDEX = 0;

interface AgentEventPayload {
  type?: string;
  [key: string]: unknown;
}

function formatSse(event: string, data: unknown): string {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  return `event: ${event}\ndata: ${payload}\n\n`;
}

function parseLine(line: string): { event: string; payload: AgentEventPayload | string } | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as AgentEventPayload;
    const event = typeof parsed.type === "string" && parsed.type.length > 0 ? parsed.type : "message";
    return { event, payload: parsed };
  } catch {
    return { event: "message", payload: { content: trimmed } };
  }
}

async function resolveAnthropicApiKey(projectRoot: string): Promise<string | undefined> {
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }

  const configPath = path.join(projectRoot, ".choragen", "config.json");
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    const parsed = JSON.parse(raw) as {
      providers?: { anthropic?: { apiKey?: string } };
    };
    const key = parsed.providers?.anthropic?.apiKey;
    return typeof key === "string" && key.trim().length > 0 ? key : undefined;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined;
    }
    return undefined;
  }
}

export const GET = DesignContract({
  designDoc: "../../docs/design/core/features/agent-runtime.md",
  name: "GET",
  preconditions: [
    "Requires workflowId query parameter",
    "stageIndex, if provided, must be a non-negative integer",
  ],
  postconditions: ["Emits Server-Sent Events stream for the requested workflow"],
  handler: async (request: Request): Promise<Response> => {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId");
    const stageIndexParam = searchParams.get("stageIndex");
    const message = searchParams.get("message") ?? undefined;

    if (!workflowId) {
      return new Response("Missing workflowId", { status: HttpStatus.BAD_REQUEST });
    }

    const parsedStageIndex =
      stageIndexParam === null || stageIndexParam === undefined ? null : Number(stageIndexParam);
    if (
      parsedStageIndex !== null &&
      (!Number.isInteger(parsedStageIndex) || parsedStageIndex < 0)
    ) {
      return new Response("Invalid stageIndex", { status: HttpStatus.BAD_REQUEST });
    }

    const projectRoot =
      process.env.CHORAGEN_PROJECT_ROOT ||
      (await fs.realpath(path.join(process.cwd(), "..", "..")).catch(() => process.cwd()));
    const workflowManager = new WorkflowManager(projectRoot);

    const workflow = await workflowManager.get(workflowId);
    if (!workflow) {
      return new Response("Workflow not found", { status: HttpStatus.NOT_FOUND });
    }

    if (workflow.status !== "active") {
      return new Response("Workflow is not active", { status: HttpStatus.BAD_REQUEST });
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const stageIndex =
      parsedStageIndex !== null
        ? parsedStageIndex
        : typeof workflow.currentStage === "number" && workflow.currentStage >= 0
          ? workflow.currentStage
          : DEFAULT_STAGE_INDEX;

    let session: AgentSession;
    try {
      session = spawnAgentSession(sessionId, {
        workflowId,
        stageIndex,
        projectRoot,
        apiKey: await resolveAnthropicApiKey(projectRoot),
        message: message ?? undefined,
      });
    } catch (error) {
      const messageContent =
        error instanceof Error && error.message ? error.message : "Failed to start agent session";
      return new Response(messageContent, { status: HttpStatus.INTERNAL_SERVER_ERROR });
    }

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        let stdoutBuffer = "";

        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(formatSse(event, data)));
        };

        const handleStdout = (chunk: Buffer) => {
          stdoutBuffer += chunk.toString();
          const lines = stdoutBuffer.split(/\r?\n/);
          stdoutBuffer = lines.pop() ?? "";

          for (const line of lines) {
            const parsed = parseLine(line);
            if (!parsed) continue;
            if (
              typeof parsed.payload === "object" &&
              parsed.payload &&
              ("gatesSatisfied" in parsed.payload || parsed.event === "gate_satisfied")
            ) {
              workflowManager
                .satisfyGate(session.workflowId, session.stageIndex, "agent")
                .catch(() => {
                  // Best-effort; errors are sent as SSE below.
                });
            }
            send(parsed.event, parsed.payload);
          }
        };

        const handleStderr = (chunk: Buffer) => {
          send("error", { message: chunk.toString() });
        };

        const cleanup = () => {
          session.stdout.off("data", handleStdout);
          session.stderr.off("data", handleStderr);
          session.process.off("exit", handleExit);
          session.process.off("close", handleClose);
          session.process.off("error", handleProcessError);
        };

        const handleExit = (code: number | null) => {
          send("done", { exitCode: code });
          cleanup();
          controller.close();
        };

        const handleClose = (code: number | null) => {
          send("done", { exitCode: code });
          cleanup();
          controller.close();
        };

        const handleProcessError = (error: Error) => {
          send("error", { message: error.message });
          cleanup();
          controller.close();
        };

        session.stdout.on("data", handleStdout);
        session.stderr.on("data", handleStderr);
        session.process.on("exit", handleExit);
        session.process.on("close", handleClose);
        session.process.on("error", handleProcessError);
      },
      cancel() {
        try {
          session.kill();
        } catch {
          // Ignore kill errors on cancel to avoid masking upstream issues.
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  },
});
