// ADR: ADR-010-agent-runtime-architecture
// Design doc: docs/design/core/features/agent-runtime.md

import { spawn, type ChildProcess } from "node:child_process";

export interface AgentSessionOptions {
  workflowId: string;
  stageIndex: number;
  projectRoot: string;
  apiKey?: string;
  message?: string;
}

export interface AgentSession {
  sessionId: string;
  workflowId: string;
  stageIndex: number;
  projectRoot: string;
  process: ChildProcess;
  stdout: NodeJS.ReadableStream;
  stderr: NodeJS.ReadableStream;
  kill: () => void;
}

// Track active sessions for lookup and lifecycle management.
const activeSessions = new Map<string, AgentSession>();

export function spawnAgentSession(sessionId: string, options: AgentSessionOptions): AgentSession {
  const proc = spawn(
    "npx",
    [
      "choragen",
      "agent:run",
      "--workflow",
      options.workflowId,
      "--stage",
      String(options.stageIndex),
      ...(options.message ? ["--message", options.message] : []),
    ],
    {
      cwd: options.projectRoot,
      env: {
        ...process.env,
        ...(options.apiKey ? { ANTHROPIC_API_KEY: options.apiKey } : {}),
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  const session: AgentSession = {
    sessionId,
    workflowId: options.workflowId,
    stageIndex: options.stageIndex,
    projectRoot: options.projectRoot,
    process: proc,
    stdout: proc.stdout!,
    stderr: proc.stderr!,
    kill: () => {
      proc.kill();
      activeSessions.delete(sessionId);
    },
  };

  activeSessions.set(sessionId, session);

  const cleanup = () => {
    activeSessions.delete(sessionId);
  };

  proc.on("exit", cleanup);
  proc.on("error", cleanup);
  proc.on("close", cleanup);

  return session;
}

export function getSession(sessionId: string): AgentSession | undefined {
  return activeSessions.get(sessionId);
}
