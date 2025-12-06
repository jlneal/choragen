# Task: Migrate Existing Chains

**Chain**: CHAIN-014-chain-types  
**Task**: 004-migrate-existing  
**Type**: implementation  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Migrate existing chain metadata files to include the new `type` field, defaulting to `implementation`.

---

## Expected Files

Update all files in:
- `docs/tasks/.chains/*.json`

---

## Changes Required

1. Add `"type": "implementation"` to all existing chain JSON files
2. For chains that were clearly design-focused, use `"type": "design"` if appropriate

---

## Existing Chains to Migrate

```
CHAIN-001-complete-bootstrap.json
CHAIN-002-add-agents-md.json
CHAIN-003-complete-enforcement.json
CHAIN-004-fix-adr-regex.json
CHAIN-005-agent-runner.json
CHAIN-006-traceability-rules.json
CHAIN-007-test-quality-rules.json
CHAIN-008-contract-rules.json
CHAIN-009-code-hygiene-rules.json
CHAIN-010-validation-scripts.json
CHAIN-011-init-command.json
CHAIN-012-complete-design-docs.json
CHAIN-013-control-task-cleanup.json
CHAIN-014-chain-types.json (already has type)
```

---

## Acceptance Criteria

- [ ] All existing chains have `type` field
- [ ] Default type is `implementation`
- [ ] Chain JSON files are valid
- [ ] No breaking changes to existing functionality

---

## Verification

```bash
# Check all chains have type field
for f in docs/tasks/.chains/*.json; do
  jq -e '.type' "$f" > /dev/null || echo "Missing type: $f"
done

pnpm build
```
