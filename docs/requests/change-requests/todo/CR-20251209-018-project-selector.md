# Change Request: Project Selector

**ID**: CR-20251209-018  
**Domain**: dashboard  
**Status**: todo  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Add a project directory selector to the web dashboard, allowing users to pick and switch between local Choragen projects.

---

## Why

Currently the web app uses `process.cwd()` or `CHORAGEN_PROJECT_ROOT` env var, with no UI to change projects. Users need to restart the server to switch projects. A project selector enables:

- Multi-project workflows without server restarts
- Recent projects list for quick switching
- Visual confirmation of which project is active

---

## Scope

**In Scope**:
- Project picker UI in header/sidebar
- Directory browser dialog (native or custom)
- Recent projects persistence (localStorage or server-side)
- Pass selected project to tRPC context
- Visual indicator of active project

**Out of Scope**:
- Remote/cloud project support
- Project creation wizard
- Multi-project simultaneous view

---

## Proposed Changes

### UI Components

```
┌─────────────────────────────────────────┐
│ 🏠 Choragen    [choragen ▼]    Settings │
└─────────────────────────────────────────┘
                    │
                    ▼
              ┌───────────────┐
              │ Recent:       │
              │ • choragen    │
              │ • my-project  │
              │ ─────────────│
              │ Browse...     │
              └───────────────┘
```

### tRPC Context Update

```typescript
// Current
projectRoot: process.env.CHORAGEN_PROJECT_ROOT || process.cwd()

// New
projectRoot: getSelectedProject() || process.env.CHORAGEN_PROJECT_ROOT || process.cwd()
```

### Storage

Recent projects stored in:
- Browser: `localStorage` for persistence across sessions
- Server: Validate directory exists before accepting

---

## Affected Design Documents

- `docs/design/core/features/web-dashboard.md`

---

## Linked ADRs

- ADR-011-web-api-architecture

---

## Commits

No commits yet.

---

## Implementation Notes

Consider security implications of arbitrary directory access. May need to restrict to directories containing `.choragen/` folder.

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
