# Task: Add unit and integration tests

**Chain**: CHAIN-034-trace-impl  
**Task**: 005-tests  
**Status**: done  
**Created**: 2025-12-08

---

## Objective

Add unit tests for the trace module components and integration tests for the full trace workflow.

---

## Expected Files

- `packages/core/src/trace/__tests__/`
- `├── trace-engine.test.ts      # TraceEngine unit tests`
- `├── cache.test.ts             # TraceCache unit tests`
- `├── parsers/`
- `│   ├── patterns.test.ts      # Regex pattern tests`
- `│   ├── source-parser.test.ts`
- `│   ├── adr-parser.test.ts`
- `│   └── ...`
- `└── formatters/`
- `├── tree-formatter.test.ts`
- `├── json-formatter.test.ts`
- `└── markdown-formatter.test.ts`

---

## Acceptance Criteria

- [ ] From design doc (lines 181-189):
- [ ] Command accepts file paths and artifact IDs
- [ ] Traces upstream toward intent
- [ ] Traces downstream toward verification
- [ ] Supports tree, JSON, and markdown output formats
- [ ] Handles cycles gracefully (no infinite loops)
- [ ] Shows broken links (referenced but not found)
- [ ] Additional test requirements:
- [ ] Regex patterns match expected inputs (from design doc examples)
- [ ] Cache TTL and invalidation work correctly
- [ ] Formatters produce expected output structure
- [ ] All tests pass: pnpm --filter @choragen/core test
- [ ] Add @design-doc and @test-type comments

---

## Notes

Focus on:
1. Regex patterns — these are critical for correct link discovery
2. Cycle detection — must not infinite loop
3. Edge cases from design doc (missing files, broken links, etc.)
