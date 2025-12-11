# Change Request: Settings Persistence

**ID**: CR-20251211-032  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Persist user settings (projects folder, selected project, UI preferences) so they survive browser refresh and server restart.

---

## Why

Currently, settings are lost when the browser is refreshed or the server restarts. Users must reconfigure their projects folder and reselect their project each time. Persistence provides:

- Seamless experience across sessions
- No repeated configuration
- Remembers last selected project
- Foundation for additional user preferences

---

## Scope

**In Scope**:
- Persist projects folder path
- Persist last selected project
- Persist UI preferences (theme, sidebar state, etc.)
- Settings stored in `.choragen/config.json` (server-side)
- Settings loaded on app startup
- Settings synced when changed

**Out of Scope**:
- User accounts / multi-user settings
- Cloud sync
- Settings export/import

---

## Acceptance Criteria

- [ ] Projects folder path persists across browser refresh
- [ ] Selected project persists across browser refresh
- [ ] Settings persist across server restart
- [ ] Settings stored in `.choragen/config.json`
- [ ] Settings loaded automatically on startup
- [ ] Settings update immediately when changed
- [ ] Graceful handling of missing/corrupt config file
- [ ] Default values when no settings exist

---

## Affected Design Documents

- [Web Chat Interface](../../../design/core/features/web-chat-interface.md)

---

## Linked ADRs

- ADR-011: Web API Architecture

---

## Dependencies

- **CR-20251211-031**: Projects Folder Scanning (provides projects folder setting)

---

## Commits

No commits yet.

---

## Implementation Notes

Config file structure (extend existing):
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

Key changes:

```
packages/core/src/config/
├── settings.ts                     # Settings schema and loader
└── __tests__/settings.test.ts

packages/web/src/
├── hooks/use-settings.ts           # Settings hook with persistence
└── server/routers/settings.ts      # Add settings endpoints
```

tRPC procedures:
- `settings.get` — Get all settings
- `settings.update` — Update settings (partial)
- `settings.getProjectsFolder` — Get projects folder
- `settings.setProjectsFolder` — Set projects folder
- `settings.getLastProject` — Get last selected project
- `settings.setLastProject` — Set last selected project

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
