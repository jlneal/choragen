# Task: Settings Integration

**Chain**: CHAIN-083-CR-20251211-032  
**Sequence**: 004  
**Type**: impl  
**Status**: done

---

## Objective

Integrate settings persistence into the existing UI components.

---

## Acceptance Criteria

- [x] Project selector loads `lastProject` on startup
- [x] Project selector saves `lastProject` when project changes
- [x] Projects folder picker loads `projectsFolder` on startup
- [x] Projects folder picker saves `projectsFolder` when changed
- [x] Settings persist across browser refresh
- [x] Settings persist across server restart

---

## Context

The project selector and folder picker already exist. This task wires them up to use the settings hook from Task 003.

---

## Files to Modify

- Components that handle project selection
- Components that handle projects folder configuration

---

## Dependencies

- Task 003 (Settings Hook) must be completed first

---

## References

- CR: [CR-20251211-032](../../../requests/change-requests/doing/CR-20251211-032-settings-persistence.md)
