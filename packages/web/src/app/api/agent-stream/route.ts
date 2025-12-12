// ADR: ADR-010-agent-runtime-architecture
// Design doc: docs/design/core/features/agent-runtime.md

import { getSession } from "@/lib/agent-subprocess";
import { WorkflowManager } from "@choragen/core";
import { HttpStatus } from "@choragen/contracts";
import * as path from "node:path";
import * as fs from "node:fs/promises";

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

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return new Response("Missing sessionId", { status: HttpStatus.BAD_REQUEST });
  }

  const session = getSession(sessionId);
  if (!session) {
    return new Response("Session not found", { status: HttpStatus.NOT_FOUND });
  }

  const projectRoot =
    process.env.CHORAGEN_PROJECT_ROOT ||
    (await fs.realpath(path.join(process.cwd(), "..", "..")).catch(() => process.cwd()));
  const workflowManager = new WorkflowManager(projectRoot);

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
}
