# Task: Strengthen Commit-msg Hook

**Chain**: CHAIN-016-agentic-chassis  
**Task**: 002-strengthen-commit-msg  
**Type**: implementation  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Strengthen the commit-msg hook to BLOCK (not just warn) on invalid states. Match itinerary-planner's enforcement.

---

## Reference

See `/Users/justin/Projects/itinerary-planner/githooks/commit-msg` for the target implementation.

---

## Expected Files

Update:
- `githooks/commit-msg`

---

## Changes Required

1. **BLOCK commits to `todo/` requests**
   - Currently warns, should exit 1
   - Message: "Cannot commit to $request_id - request is still in todo/"
   - Instruct user to move to doing/ first

2. **BLOCK commits to archived requests**
   - Check `docs/requests/*/archive/` directories
   - Message: "Cannot commit to archived request"
   - Instruct user to create new CR/FR

3. **Validate scope matches changed files** (optional, can be warning)
   - Map scopes to file patterns
   - e.g., `core` → `packages/core/`
   - e.g., `cli` → `packages/cli/`
   - e.g., `docs` → `docs/`

4. **Improve error messages**
   - Show the actual request file path
   - Show how to fix the issue

---

## Acceptance Criteria

- [ ] Commits to `todo/` requests are BLOCKED (exit 1)
- [ ] Commits to archived requests are BLOCKED (exit 1)
- [ ] Commits to `doing/` and `done/` requests are allowed
- [ ] Error messages are clear and actionable
- [ ] Exempt types still work (chore(deps), ci, etc.)

---

## Verification

```bash
# Create a test CR in todo/
echo "test" > docs/requests/change-requests/todo/CR-TEST-001.md

# Try to commit - should FAIL
git add .
git commit -m "test(core): should fail CR-TEST-001"
# Expected: exit 1, message about moving to doing/

# Clean up
rm docs/requests/change-requests/todo/CR-TEST-001.md
```
