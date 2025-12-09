# Task: Implement list_files Tool

**ID**: 003-list-files-tool  
**Chain**: CHAIN-039-file-operations  
**Status**: done  
**Type**: impl  
**CR**: CR-20251207-027  

---

## Objective

Implement the `list_files` tool that allows agents to list directory contents with optional filtering.

---

## Acceptance Criteria

- [ ] Create `list_files` tool definition in `packages/cli/src/runtime/tools/definitions/list-files.ts`
- [ ] Tool accepts `path` (required), `pattern` (optional), `recursive` (optional) parameters
- [ ] Returns list of files/directories with type indicator
- [ ] Supports glob patterns for filtering
- [ ] Both `control` and `impl` roles can use this tool
- [ ] Register tool in `registry.ts`
- [ ] Add unit tests for tool definition and executor

---

## Implementation Notes

### Tool Definition

```typescript
const listFilesTool: ToolDefinition = {
  name: "list_files",
  description: "List files and directories at a path",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Directory path (relative to project root)" },
      pattern: { type: "string", description: "Glob pattern to filter results" },
      recursive: { type: "boolean", description: "Include subdirectories" }
    },
    required: ["path"]
  },
  allowedRoles: ["control", "impl"]
};
```

### Return Format

```json
{
  "path": "packages/core/src",
  "entries": [
    { "name": "index.ts", "type": "file", "size": 1234 },
    { "name": "chains/", "type": "directory", "items": 5 }
  ]
}
```

---

## Files to Create/Modify

- `packages/cli/src/runtime/tools/definitions/list-files.ts` (create)
- `packages/cli/src/runtime/tools/registry.ts` (modify - add import and registration)
- `packages/cli/src/runtime/tools/executor.ts` (modify - add executor)
- `packages/cli/src/__tests__/tool-definitions.test.ts` (modify - add tests)
- `packages/cli/src/__tests__/tool-executors.test.ts` (modify - add tests)
