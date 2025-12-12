# Task: Add category/mutates fields to ToolDefinition and update all tool definitions

**Chain**: CHAIN-064-role-based-tool-access  
**Task**: 004-004-tool-definition-fields  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Add `category` and `mutates` fields to the `ToolDefinition` interface and update all existing tool definitions with appropriate values.

---

## Expected Files

- `packages/cli/src/runtime/tools/types.ts - Update ToolDefinition interface`
- `packages/cli/src/runtime/tools/definitions/*.ts - Update all 11 tool files`

---

## Acceptance Criteria

- [ ] ToolDefinition interface updated with:
- [ ] - category: string - Category for UI grouping
- [ ] - mutates: boolean - Whether tool can modify state
- [ ] All tool definitions updated with category values:
- [ ] | Tool | Category | Mutates |
- [ ] |------|----------|---------|
- [ ] | read_file | filesystem | false |
- [ ] | write_file | filesystem | true |
- [ ] | list_files | filesystem | false |
- [ ] | search_files | search | false |
- [ ] | chain:status | chain | false |
- [ ] | task:status | task | false |
- [ ] | task:list | task | false |
- [ ] | task:start | task | true |
- [ ] | task:complete | task | true |
- [ ] | task:approve | task | true |
- [ ] | spawn_impl_session | session | true |
- [ ] No changes to allowedRoles yet (that's Task 009)
- [ ] pnpm build passes
- [ ] pnpm --filter @choragen/cli test passes
- [ ] pnpm lint passes

---

## Constraints

- Keep allowedRoles field intact for now
- Use exact category strings from design doc
- Follow existing code style in tool definitions

---

## Notes

Categories from design doc:
- `filesystem` - File operations
- `search` - Search operations
- `chain` - Chain management
- `task` - Task management
- `session` - Session management
- `command` - Shell commands (no tools use this yet)

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
