# Task: Export and Integrate

**ID**: 005  
**Chain**: CHAIN-077-session-handoff-gate  
**Type**: impl  
**Status**: todo  
**Created**: 2025-12-14  

---

## Description

Export the new session handoff gate types and functions from the package, and integrate with the workflow gates index.

---

## Acceptance Criteria

- [ ] Types exported from `packages/core/src/workflow/gates/index.ts`
- [ ] Functions exported from `packages/core/src/workflow/gates/index.ts`
- [ ] Re-exported from `packages/core/src/index.ts`
- [ ] Build passes with `pnpm build`
- [ ] Typecheck passes with `pnpm --filter @choragen/core typecheck`
- [ ] Lint passes with `pnpm lint`

---

## File Scope

- `packages/core/src/workflow/gates/index.ts`
- `packages/core/src/index.ts`

---

## Dependencies

- Task 001 (handoff-types.ts)
- Task 002 (handoff-validation.ts)
- Task 003 (session-handoff.ts)
- Task 004 (unit-tests.ts)

---

## Implementation Notes

Exports to add:
```typescript
// From gates/index.ts
export * from "./handoff-types.js";
export * from "./handoff-validation.js";
export * from "./session-handoff.js";

// From src/index.ts (if not already re-exporting gates)
export * from "./workflow/gates/index.js";
```

Verify the exports work by checking the generated `.d.ts` files after build.

---

## Completion Notes

[Added when task is complete]
