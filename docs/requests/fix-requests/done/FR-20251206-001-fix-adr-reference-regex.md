# Fix Request: ADR Reference Regex Not Matching Valid References

**ID**: FR-20251206-001  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-06  
**Owner**: Justin  

---

## Problem

The `require-adr-reference` ESLint rule fails to recognize valid ADR references in source files. Files with correct `// ADR: ADR-001-task-file-format` comments are still flagged as missing ADR references.

---

## Root Cause

The regex pattern `(?:\/\/|\/\*|\*)\s*(?:ADR:|@adr)\s*(ADR-\d{3}-[\w-]+)` has two issues:

1. It includes comment markers (`//`, `/*`, `*`) but ESLint's `comment.value` already strips these
2. It requires exactly 3 digits (`\d{3}`) but our ADRs use variable digits

---

## Fix

Change the regex from:
```javascript
const ADR_PATTERN = /(?:\/\/|\/\*|\*)\s*(?:ADR:|@adr)\s*(ADR-\d{3}-[\w-]+)/;
```

To:
```javascript
const ADR_PATTERN = /(?:ADR:|@adr)\s*(ADR-\d+-[\w-]+)/;
```

---

## Acceptance Criteria

- [x] Regex pattern fixed
- [x] Pattern matching order fixed (escape dots before replacing globs)
- [x] `pnpm build` passes
- [x] `pnpm lint` shows reduced warnings (29 → 10)
- [x] Files with valid ADR references no longer flagged

---

## Completion Notes

**Completed**: 2025-12-06

Fixed via CHAIN-004-fix-adr-regex (2 tasks):

**Task 001**: Fixed regex pattern
- Removed comment markers from regex (ESLint strips them)
- Fixed glob pattern matching order (escape dots before replacing globs)
- Warnings: 29 → 10

**Task 002**: Fixed remaining warnings
- Removed unused imports/vars
- Added test metadata to 3 test files
- Elevated all choragen rules to error level
- Warnings: 10 → 0

Final state: `pnpm lint` passes with 0 errors, 0 warnings.
