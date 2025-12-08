# Task: Implement core TraceEngine class in @choragen/core

**Chain**: CHAIN-034-trace-impl  
**Task**: 001-core-tracer  
**Status**: done  
**Created**: 2025-12-08

---

## Objective

Implement the core `TraceEngine` class that orchestrates traceability traversal. This is the foundation that link parsers and formatters will plug into.

---

## Expected Files

- `packages/core/src/trace/`
- `├── index.ts              # Public exports`
- `├── trace-engine.ts       # Main TraceEngine class`
- `├── types.ts              # TypeScript interfaces from design doc`
- `└── cache.ts              # TraceCache implementation`

---

## Acceptance Criteria

- [ ] Create packages/core/src/trace/types.ts with interfaces from design doc
- [ ] Create TraceEngine class with trace(artifactPath: string, options: TraceOptions): Promise<TraceResult>
- [ ] Implement cycle detection (visited set pattern from design doc)
- [ ] Implement TraceCache class with 4-level caching from design doc
- [ ] Export from packages/core/src/index.ts
- [ ] Add // @design-doc docs/design/core/features/trace-command.md to source files

---

## Notes

This task creates the skeleton. Link parsers (task 002) will implement the actual file parsing. Keep the `discoverLinks()` method as an abstract/pluggable interface for now.
