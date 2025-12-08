# Change Request: Traceability Explorer

**ID**: CR-20251206-011  
**Domain**: cli  
**Status**: todo  
**Created**: 2025-12-06  
**Owner**: agent  

---

## What

Add a CLI command and/or script that produces full traceability traces for any artifact in the system. Given a starting point (CR, FR, ADR, design doc, source file, test, or chain), walk the traceability links in both directions and output a complete trace.

---

## Why

1. **Debugging traceability gaps** — Quickly see what's missing in the chain
2. **Impact analysis** — "What will be affected if I change this ADR?"
3. **Onboarding** — Understand how artifacts relate to each other
4. **Audit** — Verify that the traceability chain is complete for a given feature
5. **Documentation** — Generate traceability reports for stakeholders

---

## Scope

**In Scope**:
- CLI command: `choragen trace <artifact-path-or-id>`
- Walk upstream (toward intent): source → ADR → design doc → CR/FR
- Walk downstream (toward implementation): CR/FR → design doc → ADR → source → tests
- Output formats: tree (default), JSON, markdown
- Handle cycles gracefully
- Show broken links (referenced but not found)

**Out of Scope**:
- GUI visualization (future enhancement)
- Automatic link repair
- Git history integration (which commit introduced this?)

---

## Example Usage

```bash
# Trace from a source file
$ choragen trace packages/core/src/tasks/chain-manager.ts

Traceability for: packages/core/src/tasks/chain-manager.ts

UPSTREAM (toward intent):
├── ADR: docs/adr/done/ADR-001-task-file-format.md
│   ├── Design: docs/design/core/features/task-chain-management.md
│   │   └── Request: docs/requests/change-requests/done/CR-20251205-001-bootstrap-choragen.md
│   └── Request: docs/requests/change-requests/done/CR-20251205-001-bootstrap-choragen.md

DOWNSTREAM (toward verification):
├── Test: packages/core/src/tasks/__tests__/chain-manager.test.ts [MISSING]
└── Consumers: packages/cli/src/cli.ts

# Trace from a CR
$ choragen trace CR-20251206-008

Traceability for: CR-20251206-008 (Comprehensive Test Coverage)

DOWNSTREAM:
├── Chains: (none yet)
├── ADRs: (none yet)
├── Design Docs: 
│   ├── docs/design/core/features/task-chain-management.md
│   ├── docs/design/core/features/governance-enforcement.md
│   └── docs/design/core/features/file-locking.md
└── Implementation: (pending)

# JSON output for tooling
$ choragen trace ADR-001-task-file-format --format=json
```

---

## Affected Design Documents

- docs/design/DEVELOPMENT_PIPELINE.md (documents the traceability chain)
- docs/design/core/features/task-chain-management.md

---

## Linked ADRs

- ADR-001-task-file-format (defines task/chain structure)
- ADR-002-governance-schema (defines traceability requirements)

---

## Commits

No commits yet.

---

## Implementation Notes

### Link Discovery Strategy

**From source files:**
- Parse `// ADR: ADR-xxx` comments
- Parse `@design-doc` JSDoc tags
- Parse imports to find consumers

**From ADRs:**
- Parse `Linked CR/FR:` field
- Parse `Linked Design Docs:` field
- Parse `Implementation:` section for file paths
- Grep source files for `// ADR: <this-adr>`

**From Design Docs:**
- Parse `Linked ADRs:` section
- Parse `Implementation:` section
- Find tests with `@design-doc` pointing here

**From CRs/FRs:**
- Find chains with matching `requestId`
- Find ADRs with `Linked CR/FR:` pointing here
- Find design docs referenced in scope

**From Chains:**
- Load chain metadata for `requestId`
- Find tasks and their referenced files

### Output Formats

1. **Tree (default)** — Human-readable indented tree
2. **JSON** — Machine-readable for tooling integration
3. **Markdown** — For documentation/reports

### Validation Integration

Could integrate with existing validators:
- `validate-complete-traceability.mjs` already does some of this
- Extract shared link-discovery logic into `@choragen/core`

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
