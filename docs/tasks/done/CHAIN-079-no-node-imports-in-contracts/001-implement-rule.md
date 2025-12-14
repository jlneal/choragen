# Task: Implement no-node-imports-in-contracts ESLint Rule

**Chain**: CHAIN-079-no-node-imports-in-contracts  
**Task**: 001-implement-rule  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Create an ESLint rule `no-node-imports-in-contracts` that prevents Node.js-specific imports in the `@choragen/contracts` package, ensuring it remains client-safe.

---

## Context

- **CR**: CR-20251214-003
- **Related FR**: FR-20251214-001 (webpack bundling error from Node.js imports)
- **Reference Implementation**: `packages/eslint-plugin/src/rules/no-core-in-client-component.ts` — similar pattern for detecting imports

`@choragen/contracts` is designed to be importable from both server and client code. If Node.js-specific imports are accidentally added, it breaks client-side bundling.

---

## Expected Files

- `packages/eslint-plugin/src/rules/no-node-imports-in-contracts.ts`
- `packages/eslint-plugin/src/rules/__tests__/no-node-imports-in-contracts.test.ts`
- Update `packages/eslint-plugin/src/rules/index.ts` to export the new rule

---

## Acceptance Criteria

- [ ] Rule detects `node:*` protocol imports (e.g., `node:fs`, `node:path`, `node:crypto`)
- [ ] Rule detects bare Node.js module imports (`fs`, `path`, `crypto`, `child_process`, `os`, `http`, `https`, `net`, `dgram`, `dns`, `tls`, `readline`, `repl`, `vm`, `worker_threads`, `cluster`, `perf_hooks`, `async_hooks`, `v8`, `inspector`)
- [ ] Rule only applies to files in `packages/contracts/` (check filename pattern)
- [ ] Rule provides actionable error message: "Node.js import '{{module}}' is not allowed in @choragen/contracts. This package must remain client-safe. Move Node.js-specific code to @choragen/core."
- [ ] Rule is exported from `packages/eslint-plugin/src/rules/index.ts`
- [ ] Comprehensive test coverage with valid/invalid cases
- [ ] Tests pass: `pnpm --filter @choragen/eslint-plugin test`
- [ ] Build passes: `pnpm build`

---

## Constraints

- Follow existing rule patterns in `packages/eslint-plugin/src/rules/`
- Use `HttpStatus` enum from `@choragen/contracts` in tests (no magic numbers)
- Include proper JSDoc header with ADR reference: `ADR-002-governance-schema`
- Include CR reference: `CR-20251214-003`

---

## Notes

The rule should check the filename to determine if it's in the contracts package. Pattern: `/packages/contracts/` in the file path.

Node.js built-in modules list (comprehensive):
- `fs`, `path`, `os`, `crypto`, `child_process`, `http`, `https`, `net`, `dgram`, `dns`, `tls`, `readline`, `repl`, `vm`, `worker_threads`, `cluster`, `perf_hooks`, `async_hooks`, `v8`, `inspector`, `buffer`, `stream`, `zlib`, `util`, `events`, `assert`, `url`, `querystring`, `string_decoder`, `timers`, `tty`, `punycode`, `domain`, `constants`, `module`, `process`

---

## Verification Commands

```bash
pnpm --filter @choragen/eslint-plugin test
pnpm build
pnpm lint
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
