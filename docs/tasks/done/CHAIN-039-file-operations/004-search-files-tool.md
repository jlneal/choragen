# Task: Implement search_files Tool

**ID**: 004-search-files-tool  
**Chain**: CHAIN-039-file-operations  
**Status**: done  
**Type**: impl  
**CR**: CR-20251207-027  

---

## Objective

Implement the `search_files` tool that allows agents to search file contents (grep-like functionality).

---

## Acceptance Criteria

- [ ] Create `search_files` tool definition in `packages/cli/src/runtime/tools/definitions/search-files.ts`
- [ ] Tool accepts `query` (required), `path` (optional), `include` (optional), `exclude` (optional) parameters
- [ ] Supports regex patterns in query
- [ ] Returns matching lines with file path and line numbers
- [ ] Limits results to prevent overwhelming output
- [ ] Both `control` and `impl` roles can use this tool
- [ ] Register tool in `registry.ts`
- [ ] Add unit tests for tool definition and executor

---

## Implementation Notes

### Tool Definition

```typescript
const searchFilesTool: ToolDefinition = {
  name: "search_files",
  description: "Search for text in files",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query (regex supported)" },
      path: { type: "string", description: "Directory to search in" },
      include: { type: "string", description: "Glob pattern for files to include" },
      exclude: { type: "string", description: "Glob pattern for files to exclude" }
    },
    required: ["query"]
  },
  allowedRoles: ["control", "impl"]
};
```

### Return Format

```json
{
  "query": "export function",
  "matches": [
    {
      "file": "packages/core/src/chains.ts",
      "line": 42,
      "content": "export function createChain(..."
    }
  ],
  "totalMatches": 15,
  "truncated": false
}
```

---

## Files to Create/Modify

- `packages/cli/src/runtime/tools/definitions/search-files.ts` (create)
- `packages/cli/src/runtime/tools/registry.ts` (modify - add import and registration)
- `packages/cli/src/runtime/tools/executor.ts` (modify - add executor)
- `packages/cli/src/__tests__/tool-definitions.test.ts` (modify - add tests)
- `packages/cli/src/__tests__/tool-executors.test.ts` (modify - add tests)
