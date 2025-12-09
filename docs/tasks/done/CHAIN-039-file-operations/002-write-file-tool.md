# Task: Implement write_file Tool

**ID**: 002-write-file-tool  
**Chain**: CHAIN-039-file-operations  
**Status**: done  
**Type**: impl  
**CR**: CR-20251207-027  

---

## Objective

Implement the `write_file` tool that allows impl agents to create or modify files, with governance validation.

---

## Acceptance Criteria

- [ ] Create `write_file` tool definition in `packages/cli/src/runtime/tools/definitions/write-file.ts`
- [ ] Tool accepts `path` (required), `content` (required), `createOnly` (optional) parameters
- [ ] Creates parent directories if they don't exist
- [ ] `createOnly: true` fails if file already exists
- [ ] Only `impl` role can use this tool (control denied)
- [ ] Register tool in `registry.ts`
- [ ] Add unit tests for tool definition and executor

---

## Implementation Notes

### Tool Definition

```typescript
const writeFileTool: ToolDefinition = {
  name: "write_file",
  description: "Write content to a file. Creates parent directories if needed.",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path to file (relative to project root)" },
      content: { type: "string", description: "Content to write" },
      createOnly: { type: "boolean", description: "If true, fail if file exists" }
    },
    required: ["path", "content"]
  },
  allowedRoles: ["impl"]  // Control cannot write files
};
```

### Return Value

```json
{
  "success": true,
  "path": "packages/core/src/foo.ts",
  "action": "created",  // or "modified"
  "bytes": 1234
}
```

---

## Files to Create/Modify

- `packages/cli/src/runtime/tools/definitions/write-file.ts` (create)
- `packages/cli/src/runtime/tools/registry.ts` (modify - add import and registration)
- `packages/cli/src/runtime/tools/executor.ts` (modify - add executor)
- `packages/cli/src/__tests__/tool-definitions.test.ts` (modify - add tests)
- `packages/cli/src/__tests__/tool-executors.test.ts` (modify - add tests)

---

## Dependencies

- Task 001 (read_file) should be done first to establish patterns
