# Change Request: Projects Folder Scanning

**ID**: CR-20251211-031  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Add the ability to select a "projects folder" that contains multiple Choragen projects, and have the web app scan that folder to discover all projects within it.

---

## Why

Users often organize their work with multiple Choragen projects under a single parent directory (e.g., `~/Projects/`). Currently, users must select each project individually. This feature allows:

- One-time configuration of a projects folder
- Automatic discovery of all Choragen projects within
- Quick switching between projects without re-browsing
- Better UX for users managing multiple projects

---

## Scope

**In Scope**:
- "Projects Folder" setting in web app
- Folder browser/picker for selecting the projects folder
- Recursive scan for directories containing `.choragen/` folder
- Project list populated from scan results
- Refresh/rescan capability
- Display project name (from folder name or config)

**Out of Scope**:
- Nested project detection (projects within projects)
- Remote/network folder support
- Project creation from this interface

---

## Acceptance Criteria

- [ ] Settings page has "Projects Folder" configuration
- [ ] Can browse/select a folder path
- [ ] Scan discovers all directories with `.choragen/` subfolder
- [ ] Discovered projects appear in project selector dropdown
- [ ] Can manually trigger rescan
- [ ] Scan is non-blocking (async with loading indicator)
- [ ] Empty state when no projects found
- [ ] Error handling for inaccessible folders

---

## Affected Design Documents

- [Web Chat Interface](../../../design/core/features/web-chat-interface.md)

---

## Linked ADRs

- ADR-011: Web API Architecture

---

## Dependencies

- None

---

## Commits

No commits yet.

---

## Implementation Notes

Key changes:

```
packages/web/src/
├── app/settings/page.tsx           # Add projects folder setting
├── components/settings/
│   └── projects-folder-picker.tsx  # Folder selection UI
└── server/routers/
    └── projects.ts                 # Add scan endpoint
```

Scan logic:
```typescript
async function scanProjectsFolder(folderPath: string): Promise<Project[]> {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  const projects: Project[] = [];
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const projectPath = path.join(folderPath, entry.name);
      const choragenPath = path.join(projectPath, ".choragen");
      
      if (await fs.exists(choragenPath)) {
        projects.push({
          name: entry.name,
          path: projectPath,
        });
      }
    }
  }
  
  return projects;
}
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
