# Task: Implement tree, JSON, and markdown formatters

**Chain**: CHAIN-034-trace-impl  
**Task**: 003-output-formatters  
**Status**: done  
**Created**: 2025-12-08

---

## Objective

Implement output formatters that convert `TraceResult` into tree (terminal), JSON, and markdown formats as specified in the design doc.

---

## Expected Files

- `packages/core/src/trace/formatters/`
- `├── index.ts              # Formatter registry and factory`
- `├── base-formatter.ts     # Abstract base class`
- `├── tree-formatter.ts     # Terminal tree output with ANSI colors`
- `├── json-formatter.ts     # JSON serialization`
- `└── markdown-formatter.ts # Markdown report generation`

---

## Acceptance Criteria

- [ ] Create base-formatter.ts with TraceFormatter interface
- [ ] Implement tree-formatter.ts with:
- [ ] - Box-drawing symbols (├── └── │)
- [ ] - ANSI colors (cyan, green, yellow, red, dim)
- [ ] - --no-color support (detect TTY or flag)
- [ ] - Summary section at bottom
- [ ] Implement json-formatter.ts — serialize TraceResult to JSON
- [ ] Implement markdown-formatter.ts with:
- [ ] - Template from design doc (lines 830-870)
- [ ] - Tables for summary and artifacts
- [ ] - Proper markdown links
- [ ] Create formatter registry in index.ts
- [ ] Export formatters from packages/core/src/trace/index.ts
- [ ] Add // @design-doc comments

---

## Notes

The CLI command (task 004) will use these formatters. Keep them in core so they can be reused by other tools.
