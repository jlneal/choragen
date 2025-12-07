# Task: Update Pre-push Hook

**Chain**: CHAIN-028-commit-discipline  
**Task**: 002-update-pre-push  
**Type**: implementation  
**Status**: todo  

---

## Objective

Add uncommitted request check to `githooks/pre-push` to block pushes when work is uncommitted.

---

## Implementation

Add to pre-push hook:

```bash
# Check for uncommitted request work
echo "[pre-push] Checking for uncommitted request work..." 1>&2
if ! node scripts/validate-uncommitted-requests.mjs 2>/dev/null; then
  echo "" 1>&2
  echo "❌ [pre-push] Uncommitted request work detected" 1>&2
  echo "   Commit your changes before pushing." 1>&2
  echo "   Run: node scripts/validate-uncommitted-requests.mjs" 1>&2
  echo "" 1>&2
  exit 1
fi
echo "✅ No uncommitted request work" 1>&2
```

---

## Acceptance Criteria

- [ ] Pre-push hook calls validate-uncommitted-requests.mjs
- [ ] Push blocked if uncommitted request work exists
- [ ] Clear error message with instructions
- [ ] Can bypass with SKIP_PRE_PUSH=1 (existing mechanism)

---

## Files to Modify

- `githooks/pre-push`
