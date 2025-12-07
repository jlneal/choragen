# Task: Implement request:close Command

**Chain**: CHAIN-029-request-close  
**Task**: 001-implement-command  
**Type**: implementation  
**Status**: todo  

---

## Objective

Add `choragen request:close <request-id>` command to the CLI.

---

## Implementation

### Command Registration

Add to `packages/cli/src/index.ts`:

```typescript
program
  .command('request:close <request-id>')
  .description('Close a request with commit traceability')
  .action(async (requestId: string) => {
    await closeRequest(requestId);
  });
```

### Core Logic

Create `packages/cli/src/commands/request-close.ts`:

1. **Find request file**
   - Search `docs/requests/change-requests/{todo,doing}/`
   - Search `docs/requests/fix-requests/{todo,doing}/`
   - Match by ID pattern in filename or content

2. **Get commits**
   ```typescript
   const commits = execSync(`git log --oneline --grep="${requestId}"`);
   ```

3. **Update file**
   - Replace `## Commits` section content
   - Update `**Status**: todo|doing` to `**Status**: done`

4. **Move file**
   - Determine destination (change-requests/done or fix-requests/done)
   - Move file

5. **Output**
   ```
   Closing CR-20251207-002...
     Found 2 commits:
       57b4d7b feat: user value traceability...
       03f5138 chore: backfill commit references...
     Updated ## Commits section
     Moved to docs/requests/change-requests/done/
   ✅ Request closed
   ```

---

## Error Handling

- No request found → `Error: Request not found: ${requestId}`
- Already in done/ → `Error: Request already closed: ${requestId}`
- No commits found → `Error: No commits found for ${requestId}. Commit your work first.`

---

## Acceptance Criteria

- [ ] Command registered in CLI
- [ ] Finds request in todo/ or doing/
- [ ] Queries git log for commits
- [ ] Populates ## Commits section
- [ ] Updates status to done
- [ ] Moves file to done/
- [ ] Proper error messages

---

## Files to Create/Modify

- `packages/cli/src/commands/request-close.ts` (new)
- `packages/cli/src/index.ts` (add command)

---

## Verification

```bash
# Test with a request that has commits
pnpm --filter @choragen/cli build
choragen request:close FR-20251207-004
```
