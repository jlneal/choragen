# Task: Settings React Hook

**Chain**: CHAIN-083-CR-20251211-032  
**Sequence**: 003  
**Type**: impl  
**Status**: done

---

## Objective

Create a React hook for settings persistence that integrates with the tRPC endpoints.

---

## Acceptance Criteria

- [x] Create `packages/web/src/hooks/use-settings.ts`
- [x] Hook loads settings on mount
- [x] Hook provides methods to update individual settings
- [x] Settings sync immediately when changed
- [x] Optimistic updates with rollback on error
- [x] Loading and error states exposed

---

## Context

The hook should provide a simple API for components to read and update settings:

```typescript
const { 
  settings, 
  isLoading, 
  setProjectsFolder, 
  setLastProject,
  updateUI 
} = useSettings();
```

---

## Files to Create

- `packages/web/src/hooks/use-settings.ts`

---

## Dependencies

- Task 002 (Settings Router) must be completed first

---

## References

- CR: [CR-20251211-032](../../../requests/change-requests/doing/CR-20251211-032-settings-persistence.md)
