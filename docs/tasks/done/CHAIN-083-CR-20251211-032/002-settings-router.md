# Task: Settings tRPC Router Endpoints

**Chain**: CHAIN-083-CR-20251211-032  
**Sequence**: 002  
**Type**: impl  
**Status**: done

---

## Objective

Add settings persistence endpoints to the existing settings router in `@choragen/web`.

---

## Acceptance Criteria

- [x] Add `settings.get` procedure — returns all settings
- [x] Add `settings.update` procedure — partial update of settings
- [x] Add `settings.getProjectsFolder` procedure
- [x] Add `settings.setProjectsFolder` procedure
- [x] Add `settings.getLastProject` procedure
- [x] Add `settings.setLastProject` procedure
- [x] Settings stored in `.choragen/config.json` under `settings` key
- [x] Settings update immediately when changed (atomic write)
- [x] Unit tests for all new procedures

---

## Context

The existing `settingsRouter` handles provider API keys. We need to extend it with settings persistence endpoints that use the schema from Task 001.

---

## Files to Modify

- `packages/web/src/server/routers/settings.ts` (extend)
- `packages/web/src/__tests__/routers/settings.test.ts` (extend)

---

## Dependencies

- Task 001 (Settings Schema) must be completed first

---

## References

- CR: [CR-20251211-032](../../../requests/change-requests/doing/CR-20251211-032-settings-persistence.md)
- ADR: ADR-011-web-api-architecture
