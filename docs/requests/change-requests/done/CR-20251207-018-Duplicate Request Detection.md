# Change Request: Duplicate Request Detection

**ID**: CR-20251207-018  
**Domain**: cli  
**Status**: done  
**Created**: 2025-12-07  
**Completed**: 2025-12-07
**Owner**: agent  
**Chain**: Skipped — single script + hook update, <150 lines  

---

## What

Add validation to detect and prevent duplicate request files (same ID appearing in multiple directories like todo/ and done/).

---

## Why

**Problem observed**: CR-20251206-003 existed in both `todo/` and `done/` directories simultaneously, causing:
- Confusion about actual request status
- Validator failures
- Manual cleanup required

**Root cause**: No enforcement prevents the same request ID from existing in multiple status directories.

---

## Scope

**In Scope**:
- Validation script: `validate-duplicate-requests.mjs`
- Pre-commit hook integration
- CLI command validation (warn when creating request with existing ID)
- Clear error messages with resolution steps

**Out of Scope**:
- Automatic resolution (user must decide which to keep)
- Cross-repo duplicate detection

---

## Proposed Solution

### 1. Validation Script

```bash
node scripts/validate-duplicate-requests.mjs
```

Scans all request directories and reports:
```
❌ Duplicate request detected: CR-20251206-003
   Found in:
     - docs/requests/change-requests/todo/CR-20251206-003-mcp-server-orchestration.md
     - docs/requests/change-requests/done/CR-20251206-003-mcp-server-orchestration.md
   Resolution: Remove the incorrect copy
```

### 2. Pre-commit Hook

Add to `githooks/pre-commit`:
- Run duplicate detection before commit
- Block commit if duplicates found

### 3. CLI Warning

When running `choragen cr:new` or `choragen fr:new`:
- Check if ID already exists anywhere
- Warn and prompt for confirmation

---

## Acceptance Criteria

- [x] `validate-duplicate-requests.mjs` detects duplicates across todo/doing/done
- [x] Pre-commit hook blocks commits with duplicate requests
- [ ] ~~CLI warns when creating request with existing ID~~ (deferred — low priority)
- [x] Clear error messages explain how to resolve

---

## Affected Design Documents

- [docs/design/core/features/validation-pipeline.md](../../../design/core/features/validation-pipeline.md)

---

## Linked ADRs

- ADR-001-task-file-format (documentation structure)

---

## Commits

- b25fbbc feat(scripts): add duplicate request detection

## Implementation Notes

**Detection logic**:
1. Scan `docs/requests/change-requests/*/` and `docs/requests/fix-requests/*/`
2. Extract request ID from filename or `**ID**:` field
3. Build map of ID → [file paths]
4. Report any ID with multiple paths

**Edge cases**:
- Same filename in different directories (duplicate)
- Different filenames with same ID in content (duplicate)
- Archived requests (should be excluded from active check)

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
