# Task: Agent Session Subprocess Spawning

**Chain**: CHAIN-066-agent-invocation-web  
**Task ID**: 003  
**Type**: impl  
**Status**: done  
**Depends On**: 002

---

## Objective

Implement subprocess-based agent session spawning. The web server spawns a CLI subprocess to run the agent, providing isolation and handling long-running sessions.

---

## Acceptance Criteria

- [ ] Web server can spawn `choragen agent:run` subprocess
- [ ] Subprocess receives workflow context (workflowId, stage, etc.)
- [ ] Stdout/stderr captured for streaming
- [ ] Process lifecycle managed (track running sessions)
- [ ] Graceful handling of process exit/errors

---

## Implementation Notes

**Architecture**: Option B from CR (subprocess)

**New file**: `packages/web/src/lib/agent-subprocess.ts`

```typescript
import { spawn } from "child_process";

interface AgentSessionOptions {
  workflowId: string;
  stageIndex: number;
  projectRoot: string;
  apiKey?: string; // From settings
}

export function spawnAgentSession(options: AgentSessionOptions) {
  const proc = spawn("npx", ["choragen", "agent:run", ...args], {
    cwd: options.projectRoot,
    env: { ...process.env, ANTHROPIC_API_KEY: options.apiKey },
  });
  
  return {
    stdout: proc.stdout,
    stderr: proc.stderr,
    pid: proc.pid,
    kill: () => proc.kill(),
  };
}
```

**CLI side**: May need to add/verify `agent:run` command exists with appropriate flags for workflow context.

---

## Verification

```bash
# Unit test subprocess spawning
pnpm --filter @choragen/web test

# Manual: verify agent can be spawned from web context
```
