# Task: Implement config router for configuration access

**Chain**: CHAIN-042-web-api-server  
**Task**: 008-config-router  
**Status**: in-review  
**Type**: impl  
**Created**: 2025-12-09

---

## Objective

Create the config tRPC router for accessing Choragen configuration. This router reads `.choragen/config.yaml` and `choragen.governance.yaml` to expose project configuration and governance rules to the web dashboard.

---

## Expected Files

- `packages/web/src/server/routers/`
- `├── config.ts              # Config router for configuration access`
- `└── index.ts               # Updated to include configRouter`

---

## Acceptance Criteria

- [ ] src/server/routers/config.ts created with procedures:
- [ ] - getProject - query: returns project config from .choragen/config.yaml
- [ ] - getGovernance - query: returns governance schema from choragen.governance.yaml
- [ ] - getPaths - query: returns configured paths (adr, design, requests, tasks)
- [ ] YAML parsing using yaml package (add to dependencies if needed)
- [ ] Zod schemas for config structures
- [ ] configRouter exported and added to appRouter in index.ts
- [ ] TypeScript compiles without errors
- [ ] pnpm lint passes

---

## Notes

**Config File**: `.choragen/config.yaml`
```yaml
project:
  name: "choragen"
  domain: "core"

paths:
  adr: "docs/adr/"
  design: "docs/design/"
  requests: "docs/requests/"
  tasks: "docs/tasks/"

domains:
  - "core"

governance: "choragen.governance.yaml"
```

**Governance File**: `choragen.governance.yaml`
- Contains `mutations` (allow/approve/deny rules)
- Contains `roles` (impl/control permissions)
- Contains `collision_detection` settings
- Contains `validation` exemptions

**YAML Parsing**:
```typescript
import { parse as parseYaml } from 'yaml';
import * as fs from 'fs/promises';

const content = await fs.readFile(configPath, 'utf-8');
const config = parseYaml(content);
```

**Note**: Add `yaml` package to dependencies if not present.

**Reference CR**: `docs/requests/change-requests/doing/CR-20251208-002-web-api-server.md`

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
