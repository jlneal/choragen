# Task: Fix require-adr-reference regex pattern

**Chain**: CHAIN-004-fix-adr-regex  
**Task**: 001-fix-regex  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Fix the `require-adr-reference` ESLint rule which fails to recognize valid ADR references. Files with correct `// ADR: ADR-001-task-file-format` comments are being flagged as missing.

---

## Expected Files

- `Modify:`
- `packages/eslint-plugin/src/rules/require-adr-reference.ts`

---

## Acceptance Criteria

- [ ] Regex pattern matches ADR references in comment text
- [ ] Pattern matching correctly excludes index.ts files
- [ ] pnpm build passes
- [ ] pnpm lint shows reduced warnings (currently 29)

---

## Notes

**Root Cause 1**: The regex includes comment markers (`//`, `/*`, `*`) but ESLint's `comment.value` already strips these.

Current:
```javascript
const ADR_PATTERN = /(?:\/\/|\/\*|\*)\s*(?:ADR:|@adr)\s*(ADR-\d{3}-[\w-]+)/;
```

Fix to:
```javascript
const ADR_PATTERN = /(?:ADR:|@adr)\s*(ADR-\d+-[\w-]+)/;
```

**Root Cause 2**: The `matchPattern` function escapes dots AFTER replacing `**` with `.*`, which breaks the pattern.

Fix: Escape dots BEFORE replacing globs.

**Verification**:
```bash
pnpm build
pnpm lint
```

Should see warnings drop from 29 to ~10.
