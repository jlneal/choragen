# Task: Create Uncommitted Requests Validator

**Chain**: CHAIN-028-commit-discipline  
**Task**: 001-create-validator  
**Type**: implementation  
**Status**: todo  

---

## Objective

Create `scripts/validate-uncommitted-requests.mjs` that detects when completed requests have uncommitted work.

---

## Logic

1. Check if there are uncommitted changes (`git status --porcelain`)
2. If no uncommitted changes, pass immediately
3. If uncommitted changes exist:
   - Get list of done requests from `docs/requests/*/done/*.md`
   - For each request, extract the ID (CR-xxx or FR-xxx)
   - Check if git log contains a commit referencing that ID
   - If any done request has no matching commit, warn/fail

---

## Output Format

```
🔍 Checking for uncommitted request work...

⚠️ Uncommitted changes detected with completed requests:

  CR-20251207-002: User Value Traceability
    Status: done (no commit found)
    Files changed: 15

  Recommendation: Commit your changes with proper CR/FR reference:
    git add -A && git commit -m "feat(scope): description

    CR-20251207-002"

❌ Push blocked: Commit your work before pushing
```

---

## Acceptance Criteria

- [ ] Script exists at `scripts/validate-uncommitted-requests.mjs`
- [ ] Detects uncommitted changes
- [ ] Identifies done requests without commits
- [ ] Clear error message with fix instructions
- [ ] Exit 0 if clean, exit 1 if uncommitted request work

---

## Files to Create

- `scripts/validate-uncommitted-requests.mjs`
