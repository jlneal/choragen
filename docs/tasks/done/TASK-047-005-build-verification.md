# Task: Build Verification

**ID**: TASK-047-005  
**Chain**: CHAIN-047-agent-session-monitor  
**Type**: impl  
**Status**: todo  
**Created**: 2025-12-09  

---

## Objective

Verify all components build and pass linting.

---

## Deliverables

1. **Run build verification**
   - `pnpm build` passes
   - `pnpm lint` passes
   - No TypeScript errors

2. **Update component index**
   - Ensure all new components are exported from `src/components/sessions/index.ts`

3. **Update hooks index**
   - Export new hooks from `src/hooks/index.ts`

---

## Acceptance Criteria

- [ ] `pnpm build` passes
- [ ] `pnpm lint` passes
- [ ] No TypeScript errors
- [ ] All components properly exported

---

## Verification Commands

```bash
pnpm --filter @choragen/web build
pnpm --filter @choragen/web lint
pnpm --filter @choragen/web typecheck
```

---

## Linked CR

- CR-20251208-007 (Agent Session Monitor)
