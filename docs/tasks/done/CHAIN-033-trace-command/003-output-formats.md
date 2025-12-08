# Task: Define output formats (tree, JSON, markdown)

**Chain**: CHAIN-033-trace-command  
**Task**: 003-output-formats  
**Status**: done  
**Created**: 2025-12-08

---

## Objective

Add a dedicated "Output Formats" section to the trace-command design doc with complete specifications for each format (tree, JSON, markdown). Include TypeScript interfaces, full examples, and formatting rules.

---

## Expected Files

- `docs/design/core/features/trace-command.md — Add new "## Output Formats" section`

---

## Acceptance Criteria

- [ ] Add ## Output Formats section after Caching Strategy
- [ ] Tree format: define symbols (├── └── │), colors, indentation rules
- [ ] JSON format: complete TypeScript interface for TraceResult
- [ ] Markdown format: full template with headings, tables, links
- [ ] Each format has a complete example output
- [ ] Document when to use each format (use cases)

---

## Notes

The JSON interface will be used by tooling integrations. The markdown format is for documentation generation. Tree format is the default for human readability.
