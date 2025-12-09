# Change Request: Agent Runtime File Operations

**ID**: CR-20251207-027  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-07  
**Owner**: control-agent  

---

## What

Add file read/write tools to the agent runtime with governance enforcement. This enables impl agents to actually modify code, not just manage tasks.

This is **Phase 3** of the Agent Runtime feature.

---

## Why

Phases 1-2 establish the agentic loop and session nesting, but agents can only execute Choragen commands (chain/task management). To be useful, impl agents need to:

1. Read source files to understand context
2. Write/modify files to implement changes
3. Have those operations validated against governance rules

Without file operations, the runtime is a task tracker, not an implementation tool.

---

## Scope

**In Scope**:
- `read_file` tool (both roles)
- `write_file` tool (impl only)
- `list_files` tool (both roles)
- `search_files` tool (both roles, grep-like)
- Governance validation for all file mutations
- Lock checking before file writes
- File operation audit logging

**Out of Scope**:
- IDE integration (syntax highlighting, etc.)
- Git operations (commit, push)
- Shell command execution
- External API calls

---

## Affected Design Documents

- [Agent Runtime](../../design/core/features/agent-runtime.md)
- [Governance Enforcement](../../design/core/features/governance-enforcement.md)
- [File Locking](../../design/core/features/file-locking.md)

---

## Linked ADRs

- ADR-007: Agent Runtime Architecture

---

## Acceptance Criteria

- [x] `read_file` tool reads file contents with line numbers
- [x] `read_file` supports offset/limit for large files
- [x] `write_file` tool creates or overwrites files
- [x] `write_file` validates against governance before execution
- [x] `write_file` checks for lock conflicts
- [x] `write_file` is only available to impl role
- [x] `list_files` tool lists directory contents
- [x] `search_files` tool searches file contents (grep-like)
- [x] All file operations are logged to session audit trail
- [x] Governance violations return clear error messages
- [x] Lock conflicts return clear error messages with lock owner

---

## Chain

**Chain**: CHAIN-039-file-operations

---

## Commits

No commits yet.

---

## Implementation Notes

### Tool Definitions

```typescript
const readFileTool = {
  name: "read_file",
  description: "Read the contents of a file",
  input_schema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path to file (relative to project root)" },
      offset: { type: "number", description: "Line number to start from (1-indexed)" },
      limit: { type: "number", description: "Maximum lines to return" }
    },
    required: ["path"]
  }
};

const writeFileTool = {
  name: "write_file",
  description: "Write content to a file. Creates parent directories if needed.",
  input_schema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path to file (relative to project root)" },
      content: { type: "string", description: "Content to write" },
      createOnly: { type: "boolean", description: "If true, fail if file exists" }
    },
    required: ["path", "content"]
  }
};

const listFilesTool = {
  name: "list_files",
  description: "List files and directories at a path",
  input_schema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Directory path (relative to project root)" },
      pattern: { type: "string", description: "Glob pattern to filter results" },
      recursive: { type: "boolean", description: "Include subdirectories" }
    },
    required: ["path"]
  }
};

const searchFilesTool = {
  name: "search_files",
  description: "Search for text in files",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query (regex supported)" },
      path: { type: "string", description: "Directory to search in" },
      include: { type: "string", description: "Glob pattern for files to include" },
      exclude: { type: "string", description: "Glob pattern for files to exclude" }
    },
    required: ["query"]
  }
};
```

### Governance Validation Flow

```
write_file called
    │
    ▼
Check role === 'impl'
    │ No → DENY "write_file requires impl role"
    │
    ▼ Yes
Check governance rules
    │ Violation → DENY "Role impl cannot modify {path}"
    │
    ▼ Pass
Check file locks
    │ Locked by other chain → DENY "File locked by {chainId}"
    │
    ▼ Pass
Execute write
    │
    ▼
Log to audit trail
```

### Audit Log Format

```jsonl
{"timestamp":"2025-12-07T21:45:32Z","session":"session-001","tool":"write_file","path":"packages/core/src/foo.ts","action":"create","bytes":1234,"governance":"pass","lock":"none"}
{"timestamp":"2025-12-07T21:45:35Z","session":"session-001","tool":"write_file","path":"docs/adr/todo/ADR-008.md","action":"modify","bytes":567,"governance":"deny","reason":"impl cannot modify docs/**"}
```

---

## Completion Notes

**Completed**: 2025-12-08

### Implementation Summary

Phase 3 of the Agent Runtime feature is complete. All file operation tools are implemented with full governance enforcement.

**Files Created** (in `packages/cli/src/runtime/tools/definitions/`):
- `read-file.ts` — Read file contents with offset/limit
- `write-file.ts` — Write files (impl-only)
- `list-files.ts` — List directory contents with glob filtering
- `search-files.ts` — Grep-like file search

**Files Modified**:
- `governance-gate.ts` — Extended with file path validation and lock checking
- `session.ts` — Added AuditLogger for file operation logging
- `executor.ts` — Integrated audit logging for file tools
- `registry.ts` — Registered all 4 new tools

**Tool Access**:
| Tool | control | impl |
|------|---------|------|
| read_file | ✓ | ✓ |
| write_file | ✗ | ✓ |
| list_files | ✓ | ✓ |
| search_files | ✓ | ✓ |

**Test Coverage**: 357 tests in `@choragen/cli`

**Verification**:
- `pnpm build` ✅
- `pnpm test` ✅
- `pnpm lint` ✅
