# Task: Implement 6 impl agent tools

**Chain**: CHAIN-005-agent-runner  
**Task**: 003-impl-tools  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Implement the 6 core tools that impl agents use to interact with the file system and run commands.

---

## Expected Files

Create:
- `packages/agent-runner/src/tools/types.ts` - Tool types
- `packages/agent-runner/src/tools/read-file.ts`
- `packages/agent-runner/src/tools/write-file.ts`
- `packages/agent-runner/src/tools/edit-file.ts`
- `packages/agent-runner/src/tools/run-command.ts`
- `packages/agent-runner/src/tools/list-directory.ts`
- `packages/agent-runner/src/tools/grep-search.ts`
- `packages/agent-runner/src/tools/index.ts` - Registry and executor

---

## Acceptance Criteria

- [ ] All 6 tools implemented
- [ ] Tool registry with definitions for LLM
- [ ] `executeTool(name, args)` function
- [ ] Error handling for each tool
- [ ] `pnpm build` passes

---

## Notes

**types.ts**:
```typescript
// ADR: ADR-004-agent-runner

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
  execute: (args: Record<string, unknown>) => Promise<string>;
}
```

**Tool implementations**:

1. **read_file**: `fs.readFile(path, 'utf-8')`
2. **write_file**: `fs.writeFile(path, content)` - Only for new files
3. **edit_file**: Read file, replace `old_string` with `new_string`, write back
4. **run_command**: `child_process.exec(command, { cwd })` with timeout
5. **list_directory**: `fs.readdir(path, { withFileTypes: true })`
6. **grep_search**: Shell out to `grep -rn pattern path`

**index.ts**:
```typescript
export const TOOLS: Tool[] = [
  readFileTool,
  writeFileTool,
  editFileTool,
  runCommandTool,
  listDirectoryTool,
  grepSearchTool,
];

export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  const tool = TOOLS.find(t => t.name === name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  return tool.execute(args);
}
```

**Safety considerations**:
- `run_command`: Add timeout (30s default)
- `write_file`: Check file doesn't exist (use edit_file for existing)
- All tools: Validate paths are within working directory

**Verification**:
```bash
pnpm build
```
