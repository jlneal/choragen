# Task: Implement link parser modules for each artifact type

**Chain**: CHAIN-034-trace-impl  
**Task**: 002-link-parsers  
**Status**: done  
**Created**: 2025-12-08

---

## Objective

Implement dedicated link parser modules for each artifact type. These parsers extract traceability links from files using the regex patterns defined in the design doc.

---

## Expected Files

- `packages/core/src/trace/parsers/`
- `├── index.ts              # Parser registry and factory`
- `├── base-parser.ts        # Abstract base class`
- `├── source-parser.ts      # Parse .ts/.js files for ADR refs, imports`
- `├── adr-parser.ts         # Parse ADR markdown for CR/FR, design doc refs`
- `├── request-parser.ts     # Parse CR/FR markdown for design doc refs`
- `├── design-parser.ts      # Parse design docs for ADR refs`
- `├── chain-parser.ts       # Parse chain metadata for request refs`
- `└── patterns.ts           # Centralized regex patterns from design doc`

---

## Acceptance Criteria

- [ ] Create patterns.ts with all regex patterns from design doc (lines 137-229)
- [ ] Create base-parser.ts with LinkParser interface/abstract class
- [ ] Implement source-parser.ts — parse // ADR:, @design-doc, imports
- [ ] Implement adr-parser.ts — parse Linked CR/FR:, Linked Design Docs:, Implementation:
- [ ] Implement request-parser.ts — parse design doc references in CR/FR
- [ ] Implement design-parser.ts — parse Linked ADRs: section
- [ ] Implement chain-parser.ts — parse chain JSON for requestId
- [ ] Create parser registry in index.ts that selects parser by artifact type
- [ ] Integrate parsers with TraceEngine.discoverLinks()
- [ ] Add // @design-doc comments to all files

---

## Notes

Each parser should return `ArtifactReference[]` with the discovered links. The TraceEngine will handle traversal and cycle detection.
