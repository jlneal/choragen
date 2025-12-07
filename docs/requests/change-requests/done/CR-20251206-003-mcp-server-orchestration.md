# Change Request: Agent Runner for Automated Task Execution

**ID**: CR-20251206-003  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-06  
**Completed**: 2025-12-07
**Owner**: Justin  

---

## What

Create a custom agent runner that enables control agents to delegate tasks to implementation agents via direct API calls (Anthropic/OpenAI). The MCP server exposes a `task:delegate` tool that spawns an impl agent subprocess.

---

## Why

Currently, the control agent → impl agent handoff requires human intervention:
1. Control agent creates task and outputs prompt
2. Human copies prompt to new session
3. Impl agent completes work
4. Human reports completion back to control agent

With an agent runner:
1. Control agent calls `task:delegate` MCP tool
2. MCP server spawns impl agent subprocess (API-based)
3. Impl agent executes task using 6 core tools
4. MCP server returns result to control agent
5. Control agent reviews and approves

---

## Architecture

```
┌─────────────────┐     MCP      ┌─────────────────┐
│  Control Agent  │◄────────────►│   MCP Server    │
│   (Windsurf)    │              │  (@choragen/)   │
└─────────────────┘              └────────┬────────┘
                                          │
                                          │ spawns
                                          ▼
                                 ┌─────────────────┐
                                 │   Impl Agent    │
                                 │ (API subprocess)│
                                 └─────────────────┘
```

---

## Design Decisions

**Resolved:**

1. **Custom agent loop** (not Aider) - Full control, minimal dependencies
2. **Multi-provider** - Support both Anthropic and OpenAI APIs
3. **Single repo scope** - No cross-repo operations
4. **Impl agents don't commit** - Control agent handles git
5. **6 core tools** for impl agent:
   - `read_file` - Read any file
   - `write_file` - Create new files
   - `edit_file` - Modify existing files (search/replace)
   - `run_command` - Build, lint, test, git status/diff/checkout
   - `list_directory` - Explore structure
   - `grep_search` - Find patterns (fallback)

---

## Scope

**In Scope**:
- `@choragen/agent-runner` package - Core agent loop
- MCP server with `task:delegate` tool
- Provider abstraction (Anthropic + OpenAI)
- 6 impl agent tools
- System prompt for impl agent
- Integration with choragen CLI

**Out of Scope**:
- IDE integration (Windsurf/VS Code)
- Remote/distributed coordination
- Authentication/authorization
- Streaming responses (wait for full completion)
- Token management (fail if context too long)

---

## Impl Agent Tools

```typescript
const TOOLS = {
  read_file: {
    description: "Read file contents",
    parameters: { path: "string" },
  },
  write_file: {
    description: "Create a new file",
    parameters: { path: "string", content: "string" },
  },
  edit_file: {
    description: "Edit existing file with search/replace",
    parameters: { path: "string", old_string: "string", new_string: "string" },
  },
  run_command: {
    description: "Run shell command",
    parameters: { command: "string", cwd?: "string" },
  },
  list_directory: {
    description: "List directory contents",
    parameters: { path: "string" },
  },
  grep_search: {
    description: "Search for pattern in files",
    parameters: { pattern: "string", path: "string" },
  },
};
```

---

## MCP Tools (for Control Agent)

```typescript
"task:delegate" - Spawn impl agent to execute task
  params: { chainId, taskId, provider, model }
  returns: { success, messages, filesChanged }

"chain:status" - Get chain progress (existing CLI wrapper)
"task:list" - List tasks in chain (existing CLI wrapper)
```

---

## Acceptance Criteria

- [ ] `@choragen/agent-runner` package created
- [ ] Provider abstraction (Anthropic + OpenAI)
- [ ] 6 impl agent tools implemented
- [ ] Agent loop with tool execution
- [ ] MCP server with `task:delegate`
- [ ] System prompt for impl agent
- [ ] End-to-end test with real task
- [ ] Documentation

---

## Estimated Effort

| Component | Lines | Time |
|-----------|-------|------|
| Agent loop | ~200 | 2-3 hours |
| Provider abstraction | ~150 | 2-3 hours |
| Tools (6) | ~300 | 3-4 hours |
| MCP integration | ~100 | 1-2 hours |
| System prompt | ~50 | 1 hour |
| Error handling | ~100 | 1-2 hours |
| **Total** | **~900** | **~2-3 days** |

---

## Affected Design Documents

- [docs/design/core/features/agent-workflow.md](../../../design/core/features/agent-workflow.md)

---

## Linked ADRs

- ADR-004-agent-runner (to be created)

---

## Completion Notes

[To be added when moved to done/]

## Commits

- c8cb94c chore(planning): create CHAIN-005-agent-runner with 8 tasks
- 49eba49 chore(planning): create CRs for next phase
