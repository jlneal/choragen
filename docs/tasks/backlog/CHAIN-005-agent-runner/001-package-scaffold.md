# Task: Create @choragen/agent-runner package

**Chain**: CHAIN-005-agent-runner  
**Task**: 001-package-scaffold  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Create the package structure for `@choragen/agent-runner`. This package will contain the agent loop, provider abstraction, and tools for impl agents.

---

## Expected Files

Create:
- `packages/agent-runner/package.json`
- `packages/agent-runner/tsconfig.json`
- `packages/agent-runner/src/index.ts`
- `packages/agent-runner/AGENTS.md`

---

## Acceptance Criteria

- [ ] Package created with correct name and version
- [ ] Dependencies: `@anthropic-ai/sdk`, `openai`
- [ ] TypeScript configured (extends root tsconfig pattern)
- [ ] Exports placeholder in index.ts
- [ ] AGENTS.md describes package purpose
- [ ] `pnpm install` works
- [ ] `pnpm build` passes

---

## Notes

**package.json**:
```json
{
  "name": "@choragen/agent-runner",
  "version": "0.0.1",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.52.0",
    "openai": "^4.77.0"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "vitest": "^2.1.9"
  }
}
```

**tsconfig.json**: Follow pattern from `packages/core/tsconfig.json`

**AGENTS.md**: Describe that this package provides:
- Agent loop for executing tasks
- Provider abstraction (Anthropic + OpenAI)
- Tool implementations for impl agents

**Verification**:
```bash
pnpm install
pnpm build
```
