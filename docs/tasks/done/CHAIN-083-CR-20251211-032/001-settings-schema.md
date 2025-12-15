# Task: Settings Schema and Loader

**Chain**: CHAIN-083-CR-20251211-032  
**Sequence**: 001  
**Type**: impl  
**Status**: done

---

## Objective

Create the settings schema and loader in `@choragen/core` to handle persistence of user settings.

---

## Acceptance Criteria

- [x] Create `packages/core/src/config/settings.ts` with settings schema
- [x] Schema includes `projectsFolder`, `lastProject`, and `ui` preferences
- [x] Loader reads from `.choragen/config.json` `settings` section
- [x] Graceful handling of missing/corrupt config file
- [x] Default values when no settings exist
- [x] Export settings types for use in web package
- [x] Unit tests in `packages/core/src/config/__tests__/settings.test.ts`

---

## Context

The existing `config.json` structure has a `providers` section. We need to add a `settings` section:

```json
{
  "providers": { ... },
  "settings": {
    "projectsFolder": "/Users/justin/Projects",
    "lastProject": "/Users/justin/Projects/choragen",
    "ui": {
      "theme": "system",
      "sidebarCollapsed": false
    }
  }
}
```

---

## Files to Create/Modify

- `packages/core/src/config/settings.ts` (create)
- `packages/core/src/config/__tests__/settings.test.ts` (create)
- `packages/core/src/config/index.ts` (modify - export settings)

---

## References

- CR: [CR-20251211-032](../../../requests/change-requests/doing/CR-20251211-032-settings-persistence.md)
- ADR: ADR-011-web-api-architecture
