# Change Request: Lint Source Code Integration

**ID**: CR-20251211-005  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Integrate ESLint and TypeScript type checking into the Universal Artifact Linting system, enabling unified linting across documentation and source code artifacts.

---

## Why

The trust layer must cover all artifact types, not just documentation. Source code is the most critical artifact category—it's what actually runs. By integrating existing linters (ESLint, TypeScript) into the unified system:

- Single command (`choragen lint`) validates everything
- Consistent violation format across all artifact types
- Trust score includes code quality metrics
- Workflow gates can enforce code standards

---

## Scope

**In Scope**:
- ESLint integration as artifact type "typescript-source" and "javascript-source"
- TypeScript type checking integration
- Test file rules (coverage threshold, no skipped tests, assertions present)
- Design-doc reference rules for source files
- DesignContract enforcement for API routes
- Unified violation output combining doc lint + ESLint + TypeScript errors
- Configuration for ESLint config path, tsconfig path

**Out of Scope**:
- Web dashboard (CR-20251211-006)
- Workflow integration (CR-20251211-007)
- Custom ESLint rules (use existing ESLint plugin system)

---

## Acceptance Criteria

- [ ] ESLint violations appear in `choragen lint` output
- [ ] TypeScript errors appear in `choragen lint` output
- [ ] Test files are validated for coverage, skipped tests, assertions
- [ ] Source files in governed paths checked for ADR references
- [ ] API routes checked for DesignContract usage
- [ ] Violations from all sources have consistent format
- [ ] Configuration supports custom ESLint/tsconfig paths
- [ ] `--type=source` flag filters to only source artifacts
- [ ] Performance: ESLint/TS run in parallel with doc linting

---

## Affected Design Documents

- [Universal Artifact Linting](../../../design/core/features/universal-artifact-linting.md)

---

## Linked ADRs

- ADR-012: Universal Artifact Linting

---

## Dependencies

- **CR-20251211-004**: Lint Core Infrastructure (needs rule engine)

---

## Commits

No commits yet.

---

## Implementation Notes

Key additions:

```
packages/core/src/lint/
├── integrations/
│   ├── eslint.ts           # ESLint runner wrapper
│   ├── typescript.ts       # TypeScript checker wrapper
│   └── index.ts
├── rules/
│   ├── source.ts           # Source file rules (ADR refs, DesignContract)
│   └── test.ts             # Test file rules
```

ESLint integration approach:
1. Use ESLint's Node API (`ESLint` class)
2. Run with project's existing config (`.eslintrc`, `eslint.config.js`)
3. Transform ESLint `LintMessage` to `LintViolation`
4. Map severity: ESLint 2 (error) → error, 1 (warning) → warning

TypeScript integration approach:
1. Use TypeScript compiler API (`ts.createProgram`)
2. Get diagnostics via `getPreEmitDiagnostics`
3. Transform `Diagnostic` to `LintViolation`
4. All TS errors are severity: error

Test file rules:
- `test/no-skipped` — Regex check for `.skip(`, `.only(`
- `test/has-assertions` — AST check for expect/assert calls
- `test/coverage-threshold` — Integration with coverage reports (optional)

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
