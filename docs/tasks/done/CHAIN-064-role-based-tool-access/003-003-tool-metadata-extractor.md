# Task: Implement ToolMetadataExtractor to scan tool definitions

**Chain**: CHAIN-064-role-based-tool-access  
**Task**: 003-003-tool-metadata-extractor  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-12

---

## Objective

Implement `ToolMetadataExtractor` in `@choragen/core` that extracts metadata from tool definitions and writes to `.choragen/tools/index.yaml`.

---

## Expected Files

- `packages/core/src/tools/tool-metadata-extractor.ts - Extractor class`
- `packages/core/src/tools/index.ts - Re-exports`
- `packages/core/src/index.ts - Update to export tools module`
- `packages/core/src/__tests__/tools/tool-metadata-extractor.test.ts - Unit tests`

---

## Acceptance Criteria

- [ ] ToolMetadataExtractor class with constructor taking projectRoot: string
- [ ] extractFromRegistry(tools: ToolDefinition[]): ToolMetadata[]
- [ ] - Converts ToolDefinition array to ToolMetadata array
- [ ] - Extracts: id (from name), name (humanized), description, category, parameters, mutates
- [ ] writeIndex(metadata: ToolMetadata[]): Promise<void>
- [ ] - Writes to .choragen/tools/index.yaml
- [ ] - Includes generatedAt timestamp
- [ ] - Creates directory if needed
- [ ] readIndex(): Promise<ToolMetadata[]>
- [ ] - Reads from .choragen/tools/index.yaml
- [ ] - Returns empty array if file doesn't exist
- [ ] sync(tools: ToolDefinition[]): Promise<void>
- [ ] - Convenience method: extract + write
- [ ] YAML format matches design doc:
- [ ] yaml
- [ ] generatedAt: 2025-12-11T00:00:00Z
- [ ] tools:
- [ ] - id: read_file
- [ ] name: Read File
- [ ] description: Read the contents of a file
- [ ] category: filesystem
- [ ] mutates: false
- [ ] parameters: {...}
- [ ] Categories file support:
- [ ] - writeCategories(categories: ToolCategory[]): Promise<void>
- [ ] - readCategories(): Promise<ToolCategory[]>
- [ ] - Writes to .choragen/tools/categories.yaml
- [ ] Unit tests cover extraction and file I/O
- [ ] pnpm build passes
- [ ] pnpm --filter @choragen/core test passes
- [ ] pnpm lint passes

---

## Constraints

- Do NOT import from @choragen/cli - the extractor receives tools as input
- Use simple YAML generation (string templates, not external libs)
- Follow existing patterns in packages/core/src/

---

## Notes

The extractor doesn't import tool definitions directly. Instead, the CLI command (Task 005) will import the registry and pass tools to the extractor.

Name humanization: `read_file` → `Read File`, `chain:status` → `Chain Status`

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
