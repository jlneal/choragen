# Task: Add File Operation Audit Logging

**ID**: 007-audit-logging  
**Chain**: CHAIN-039-file-operations  
**Status**: done  
**Type**: impl  
**CR**: CR-20251207-027  

---

## Objective

Add audit logging for all file operations to the session metrics, enabling traceability of agent file changes.

---

## Acceptance Criteria

- [ ] Log all `read_file` operations with path and result
- [ ] Log all `write_file` operations with path, action (create/modify), bytes, governance result
- [ ] Log all `list_files` and `search_files` operations
- [ ] Store logs in `.choragen/metrics/` alongside session metrics
- [ ] Include session ID, timestamp, tool name, and parameters in each log entry
- [ ] Add unit tests for audit logging

---

## Implementation Notes

### Audit Log Format (JSONL)

```jsonl
{"timestamp":"2025-12-07T21:45:30Z","session":"session-001","tool":"read_file","path":"packages/core/src/foo.ts","result":"success","lines":42}
{"timestamp":"2025-12-07T21:45:32Z","session":"session-001","tool":"write_file","path":"packages/core/src/foo.ts","action":"create","bytes":1234,"governance":"pass"}
{"timestamp":"2025-12-07T21:45:35Z","session":"session-001","tool":"write_file","path":"docs/adr/todo/ADR-008.md","action":"modify","governance":"deny","reason":"impl cannot modify docs/**"}
```

### Integration Point

Add audit logging in the tool executor after each file operation:

```typescript
async function executeReadFile(params: ReadFileParams, context: ExecutionContext): Promise<string> {
  const result = await readFileImpl(params);
  
  // Audit log
  context.auditLog?.({
    tool: 'read_file',
    path: params.path,
    result: result.success ? 'success' : 'error',
    lines: result.lineCount
  });
  
  return formatResult(result);
}
```

### File Location

`.choragen/metrics/audit-{sessionId}.jsonl`

---

## Files to Create/Modify

- `packages/cli/src/runtime/tools/executor.ts` (modify - add audit logging calls)
- `packages/cli/src/runtime/session.ts` (modify - add audit log writer)
- `packages/cli/src/__tests__/audit-logging.test.ts` (create - new test file)

---

## Dependencies

- Tasks 001-006 should be done first (all file tools and governance)
