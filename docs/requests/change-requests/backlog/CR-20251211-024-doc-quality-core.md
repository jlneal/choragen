# Change Request: Documentation Quality Core Infrastructure

**ID**: CR-20251211-024  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Build the foundational infrastructure for Documentation Quality: completeness checking, placeholder detection, link validation, and CLI commands.

---

## Why

Documentation quality is essential for the trust layer. Agent-generated documentation may be structurally valid but incomplete, contain placeholders, or have broken links. This CR establishes the core infrastructure for verifying documentation content quality.

---

## Scope

**In Scope**:
- `@choragen/core` doc-quality module (`packages/core/src/doc-quality/`)
- Completeness checking per doc type (CR, FR, ADR, feature, etc.)
- Required section validation
- Placeholder detection (`[TODO]`, `[TBD]`, `<placeholder>`, etc.)
- Internal link validation (markdown links to other docs)
- External link validation (HTTP links)
- Doc quality report data model
- Configuration via `.choragen/doc-quality.yaml`
- CLI commands: `choragen docs:quality`, `choragen docs:completeness`, `choragen docs:links`

**Out of Scope**:
- Clarity analysis — CR-20251211-025
- Web dashboard — CR-20251211-026
- Workflow integration — CR-20251211-027

---

## Acceptance Criteria

- [ ] Doc type detection from path and content
- [ ] Required section validation per doc type
- [ ] Configurable required/recommended sections
- [ ] Placeholder detection with configurable patterns
- [ ] Internal link validation (relative markdown links)
- [ ] External link validation (HTTP/HTTPS)
- [ ] Broken link reporting with line numbers
- [ ] Configuration loads from `.choragen/doc-quality.yaml`
- [ ] `choragen docs:quality` runs full quality check
- [ ] `choragen docs:completeness` checks sections only
- [ ] `choragen docs:links` validates links only
- [ ] Quality score calculation (0-100)
- [ ] Exit non-zero on quality failures

---

## Affected Design Documents

- [Documentation Quality](../../../design/core/features/documentation-quality.md)

---

## Linked ADRs

- ADR-017: Documentation Quality (to be created)

---

## Dependencies

- None

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create:

```
packages/core/src/doc-quality/
├── index.ts                    # Barrel exports
├── types.ts                    # DocQualityReport, DocFileAnalysis, etc.
├── config.ts                   # Configuration loader
├── detector.ts                 # Doc type detection
├── completeness/
│   ├── index.ts
│   ├── sections.ts             # Required section checking
│   └── placeholders.ts         # Placeholder detection
├── links/
│   ├── index.ts
│   ├── internal.ts             # Markdown link validation
│   └── external.ts             # HTTP link validation
├── score.ts                    # Quality score calculation
└── __tests__/
    ├── completeness.test.ts
    ├── links.test.ts
    └── detector.test.ts
```

CLI commands:
```
packages/cli/src/commands/docs-quality.ts
packages/cli/src/commands/docs-completeness.ts
packages/cli/src/commands/docs-links.ts
```

Doc type detection:
```typescript
function detectDocType(path: string, content: string): DocType {
  if (path.includes("change-requests")) return "change-request";
  if (path.includes("fix-requests")) return "fix-request";
  if (path.includes("/adr/")) return "adr";
  if (path.includes("/features/")) return "feature";
  if (path.includes("/scenarios/")) return "scenario";
  if (path.endsWith("README.md")) return "readme";
  // Fallback to content analysis
  if (content.includes("**ID**: CR-")) return "change-request";
  return "generic";
}
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
