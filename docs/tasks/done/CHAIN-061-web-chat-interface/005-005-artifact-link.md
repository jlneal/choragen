# Task: Create ArtifactLink component with expandable previews for CRs, chains, tasks, files

**Chain**: CHAIN-061-web-chat-interface  
**Task**: 005-005-artifact-link  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Create the ArtifactLink component that renders clickable, expandable links to artifacts (CRs, chains, tasks, files, ADRs) mentioned in chat messages.

---

## Expected Files

- `packages/web/src/components/chat/artifact-link.tsx — Expandable artifact link component`
- `packages/web/src/components/chat/artifact-preview.tsx — Preview content for expanded artifacts`
- `packages/web/src/components/chat/artifact-icon.tsx — Icon component for artifact types`

---

## Acceptance Criteria

- [ ] ArtifactLink renders artifact ID and title with type-specific icon
- [ ] Clicking expands to show ArtifactPreview
- [ ] Preview fetches and displays artifact summary (title, status, key fields)
- [ ] Supports artifact types: cr, chain, task, file, adr
- [ ] Links navigate to appropriate detail pages when clicked (not just expand)
- [ ] Collapsed by default, chevron indicates expand state
- [ ] Unit tests for ArtifactLink component

---

## Notes

Artifact messages have metadata: `{ type: "artifact", artifactType, artifactId, title }`.

Use existing tRPC routers to fetch artifact details:
- `requests.get` for CRs/FRs
- `chains.get` for chains
- `tasks.get` for tasks

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
