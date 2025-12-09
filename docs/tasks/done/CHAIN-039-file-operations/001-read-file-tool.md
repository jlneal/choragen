# Task: Implement read_file Tool

**ID**: 001-read-file-tool  
**Chain**: CHAIN-039-file-operations  
**Status**: done  
**Type**: impl  
**CR**: CR-20251207-027  

---

## Objective

Implement the `read_file` tool that allows agents to read file contents with optional offset/limit for large files.

---

## Acceptance Criteria

- [ ] Create `read_file` tool definition in `packages/cli/src/runtime/tools/definitions/read-file.ts`
- [ ] Tool accepts `path` (required), `offset` (optional), `limit` (optional) parameters
- [ ] Returns file contents with line numbers (1-indexed, like `cat -n`)
- [ ] Handles non-existent files with clear error message
- [ ] Handles binary files gracefully (reject or warn)
- [ ] Both `control` and `impl` roles can use this tool
- [ ] Register tool in `registry.ts`
- [ ] Add unit tests for tool definition and executor

---

## Implementation Notes

### Tool Definition

```typescript
const readFileTool: ToolDefinition = {
  name: "read_file",
  description: "Read the contents of a file",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path to file (relative to project root)" },
      offset: { type: "number", description: "Line number to start from (1-indexed)" },
      limit: { type: "number", description: "Maximum lines to return" }
    },
    required: ["path"]
  },
  allowedRoles: ["control", "impl"]
};
```

### Output Format

```
     1→import { foo } from "./bar.js";
     2→
     3→export function example() {
     4→  return foo();
     5→}
```

---

## Files to Create/Modify

- `packages/cli/src/runtime/tools/definitions/read-file.ts` (create)
- `packages/cli/src/runtime/tools/registry.ts` (modify - add import and registration)
- `packages/cli/src/runtime/tools/executor.ts` (modify - add executor)
- `packages/cli/src/__tests__/tool-definitions.test.ts` (modify - add tests)
- `packages/cli/src/__tests__/tool-executors.test.ts` (modify - add tests)
