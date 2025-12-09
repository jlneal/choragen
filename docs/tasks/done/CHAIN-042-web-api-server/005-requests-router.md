# Task: Implement requests router for CR/FR CRUD

**Chain**: CHAIN-042-web-api-server  
**Task**: 005-requests-router  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-09

---

## Objective

Create the requests tRPC router for managing Change Requests (CR) and Fix Requests (FR). Since there's no RequestManager in @choragen/core, this router will implement file-based operations directly, reading/writing markdown files in `docs/requests/`.

---

## Expected Files

- `packages/web/src/server/routers/`
- `├── requests.ts            # Requests router for CR/FR CRUD`
- `└── index.ts               # Updated to include requestsRouter`

---

## Acceptance Criteria

- [ ] src/server/routers/requests.ts created with procedures:
- [ ] - list - query: returns all CRs and FRs (scans directories)
- [ ] - listChangeRequests - query: returns all CRs with status filter
- [ ] - listFixRequests - query: returns all FRs with status filter
- [ ] - get - query: returns single request by ID
- [ ] - getContent - query: returns raw markdown content
- [ ] - updateStatus - mutation: moves request between todo/doing/done
- [ ] Parses request metadata from markdown frontmatter
- [ ] Zod schemas for all inputs
- [ ] requestsRouter exported and added to appRouter in index.ts
- [ ] TypeScript compiles without errors
- [ ] pnpm lint passes

---

## Notes

**Request Directory Structure**:
```
docs/requests/
├── change-requests/
│   ├── todo/
│   ├── doing/
│   └── done/
└── fix-requests/
    ├── todo/
    ├── doing/
    └── done/
```

**Request Metadata** (parsed from markdown):
```typescript
interface RequestMetadata {
  id: string;           // e.g., "CR-20251208-002"
  type: 'cr' | 'fr';
  title: string;
  domain: string;
  status: 'todo' | 'doing' | 'done';
  created: string;
  severity?: string;    // FR only: high/medium/low
  filePath: string;     // Relative path to file
}
```

**Parsing Pattern**:
```typescript
// Extract from markdown frontmatter-style headers
const idMatch = content.match(/\*\*ID\*\*:\s*(\S+)/);
const domainMatch = content.match(/\*\*Domain\*\*:\s*(\S+)/);
const statusMatch = content.match(/\*\*Status\*\*:\s*(\S+)/);
```

**Reference CR**: `docs/requests/change-requests/doing/CR-20251208-002-web-api-server.md`

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
