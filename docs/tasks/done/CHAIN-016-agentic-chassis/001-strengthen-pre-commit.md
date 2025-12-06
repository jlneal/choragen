# Task: Strengthen Pre-commit Hook

**Chain**: CHAIN-016-agentic-chassis  
**Task**: 001-strengthen-pre-commit  
**Type**: implementation  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Strengthen the pre-commit hook to match itinerary-planner's enforcement level. Add contextual validation based on what files changed.

---

## Reference

See `/Users/justin/Projects/itinerary-planner/githooks/pre-commit` for the target implementation.

---

## Expected Files

Update:
- `githooks/pre-commit`

---

## Changes Required

1. **Format staged files** (if we add prettier)
   - Or skip if not using prettier

2. **Package.json ↔ pnpm-lock.yaml sync check**
   ```bash
   # If package.json changed, pnpm-lock.yaml must also be staged
   ```

3. **Lint staged TypeScript files**
   ```bash
   # Run ESLint on staged .ts/.tsx files
   ```

4. **Contextual validation based on changed files**:
   - If `docs/design/**` or `docs/adr/**` changed → run `validate-links.mjs`
   - If `docs/adr/**` changed → run `validate-adr-traceability.mjs`
   - If source `.ts` files changed → run `validate-source-adr-references.mjs`
   - If `docs/design/**/*.md` changed → run `validate-design-doc-content.mjs`
   - If `docs/requests/**` changed → run `validate-request-completion.mjs`

5. **Keep existing checks**:
   - Build check
   - Console.log warnings
   - TODO/FIXME warnings

---

## Acceptance Criteria

- [ ] Package.json changes require pnpm-lock.yaml
- [ ] ESLint runs on staged TypeScript files
- [ ] Validation scripts run contextually based on changed files
- [ ] Hook blocks on validation failures (not just warns)
- [ ] Existing build check preserved

---

## Verification

```bash
# Test with a staged doc change
git add docs/design/core/features/task-chain-management.md
git commit -m "test: verify pre-commit" --dry-run

# Should see validation output
```
