/**
 * @design-doc docs/design/core/features/trace-command.md
 * @test-type unit
 * @user-intent "Verify ADR parser correctly extracts linked requests, design docs, and implementation references"
 *
 * Tests for the AdrParser that extracts traceability links from ADR markdown files.
 */

import { describe, it, expect } from "vitest";
import { AdrParser } from "../../parsers/adr-parser.js";
import type { ParseContext } from "../../parsers/base-parser.js";

describe("AdrParser", () => {
  const parser = new AdrParser();

  const createContext = (
    filePath: string,
    artifactId?: string
  ): ParseContext => ({
    projectRoot: "/project",
    filePath,
    artifactType: "adr",
    artifactId,
  });

  describe("canParse", () => {
    it("can parse ADR files by type", () => {
      const context = createContext("docs/adr/done/ADR-001.md", "ADR-001");
      expect(parser.canParse(context)).toBe(true);
    });

    it("can parse files in adr directory", () => {
      const context: ParseContext = {
        projectRoot: "/project",
        filePath: "docs/adr/todo/ADR-002-new.md",
        artifactType: "external", // Even with wrong type
        artifactId: "ADR-002-new",
      };
      expect(parser.canParse(context)).toBe(true);
    });

    it("cannot parse non-ADR files", () => {
      const context: ParseContext = {
        projectRoot: "/project",
        filePath: "docs/design/core/features/trace.md",
        artifactType: "design",
      };
      expect(parser.canParse(context)).toBe(false);
    });
  });

  describe("Linked CR/FR extraction", () => {
    it("extracts Linked CR/FR field with CR", () => {
      const content = `
# ADR-001: Task File Format

**Status**: done
**Linked CR/FR**: CR-20251206-011
**Linked Design Docs**: docs/design/core/features/task-management.md

## Context
...
      `;
      const result = parser.parse(
        content,
        createContext("docs/adr/done/ADR-001.md", "ADR-001")
      );

      expect(result.upstream.some((ref) => ref.type === "request")).toBe(true);
      expect(
        result.upstream.some((ref) => ref.id === "CR-20251206-011")
      ).toBe(true);
    });

    it("extracts Linked CR/FR field with FR", () => {
      const content = `
# ADR-002: Bug Fix

**Linked CR/FR**: FR-20251207-002

## Context
...
      `;
      const result = parser.parse(
        content,
        createContext("docs/adr/done/ADR-002.md", "ADR-002")
      );

      expect(
        result.upstream.some((ref) => ref.id === "FR-20251207-002")
      ).toBe(true);
    });

    it("extracts CR/FR IDs mentioned in body", () => {
      const content = `
# ADR-003: Multiple Requests

## Context

This ADR addresses both CR-20251206-001 and FR-20251207-003.
      `;
      const result = parser.parse(
        content,
        createContext("docs/adr/done/ADR-003.md", "ADR-003")
      );

      expect(
        result.upstream.some((ref) => ref.id === "CR-20251206-001")
      ).toBe(true);
      expect(
        result.upstream.some((ref) => ref.id === "FR-20251207-003")
      ).toBe(true);
    });

    it("deduplicates request references", () => {
      const content = `
# ADR-004

**Linked CR/FR**: CR-20251206-011

## Context

See CR-20251206-011 for details. Also CR-20251206-011.
      `;
      const result = parser.parse(
        content,
        createContext("docs/adr/done/ADR-004.md", "ADR-004")
      );

      const crRefs = result.upstream.filter(
        (ref) => ref.id === "CR-20251206-011"
      );
      expect(crRefs.length).toBe(1);
    });
  });

  describe("Linked Design Docs extraction", () => {
    it("extracts Linked Design Docs field", () => {
      const content = `
# ADR-001

**Linked Design Docs**: docs/design/core/features/task-management.md

## Context
...
      `;
      const result = parser.parse(
        content,
        createContext("docs/adr/done/ADR-001.md", "ADR-001")
      );

      expect(result.upstream.some((ref) => ref.type === "design")).toBe(true);
      expect(
        result.upstream.some((ref) =>
          ref.path.includes("task-management.md")
        )
      ).toBe(true);
    });

    it("extracts design doc paths from body", () => {
      const content = `
# ADR-002

## Context

See docs/design/core/features/trace-command.md for the full design.
Also related to docs/design/core/scenarios/agent-workflow.md.
      `;
      const result = parser.parse(
        content,
        createContext("docs/adr/done/ADR-002.md", "ADR-002")
      );

      const designRefs = result.upstream.filter((ref) => ref.type === "design");
      expect(designRefs.length).toBeGreaterThanOrEqual(2);
    });

    it("deduplicates design doc references", () => {
      const content = `
# ADR-003

**Linked Design Docs**: docs/design/core/features/trace.md

## Context

See docs/design/core/features/trace.md for details.
      `;
      const result = parser.parse(
        content,
        createContext("docs/adr/done/ADR-003.md", "ADR-003")
      );

      const traceRefs = result.upstream.filter((ref) =>
        ref.path.includes("trace")
      );
      expect(traceRefs.length).toBe(1);
    });
  });

  describe("ADR cross-reference extraction", () => {
    it("extracts references to other ADRs", () => {
      const content = `
# ADR-003: File Locking

## Context

This builds on ADR-001-task-file-format and ADR-002-governance.
      `;
      const result = parser.parse(
        content,
        createContext("docs/adr/done/ADR-003.md", "ADR-003")
      );

      expect(
        result.upstream.some((ref) => ref.id === "ADR-001-task-file-format")
      ).toBe(true);
      expect(
        result.upstream.some((ref) => ref.id === "ADR-002-governance")
      ).toBe(true);
    });

    it("excludes self-references", () => {
      const content = `
# ADR-001-task-file-format

## Context

This is ADR-001-task-file-format. It references ADR-002.
      `;
      const result = parser.parse(
        content,
        createContext("docs/adr/done/ADR-001-task-file-format.md", "ADR-001-task-file-format")
      );

      // Should not include self-reference
      expect(
        result.upstream.some((ref) => ref.id === "ADR-001-task-file-format")
      ).toBe(false);
      // Should include other ADR
      expect(result.upstream.some((ref) => ref.id === "ADR-002")).toBe(true);
    });

    it("extracts bare ADR IDs", () => {
      const content = `
# ADR-005

## Context

See ADR-001 and ADR-002 for background.
      `;
      const result = parser.parse(
        content,
        createContext("docs/adr/done/ADR-005.md", "ADR-005")
      );

      expect(result.upstream.some((ref) => ref.id === "ADR-001")).toBe(true);
      expect(result.upstream.some((ref) => ref.id === "ADR-002")).toBe(true);
    });
  });

  describe("Implementation section extraction", () => {
    it("extracts source file references from Implementation section", () => {
      const content = `
# ADR-001

## Implementation

- \`packages/core/src/tasks/task-manager.ts\`
- \`packages/core/src/tasks/chain-manager.ts\`

## Notes
...
      `;
      const result = parser.parse(
        content,
        createContext("docs/adr/done/ADR-001.md", "ADR-001")
      );

      expect(result.downstream.some((ref) => ref.type === "source")).toBe(true);
      expect(
        result.downstream.some((ref) => ref.path.includes("task-manager.ts"))
      ).toBe(true);
      expect(
        result.downstream.some((ref) => ref.path.includes("chain-manager.ts"))
      ).toBe(true);
    });

    it("extracts markdown links from Implementation section", () => {
      const content = `
# ADR-002

## Implementation

- [TaskParser](packages/core/src/tasks/task-parser.ts)
- [Types](packages/core/src/tasks/types.ts)

## Notes
      `;
      const result = parser.parse(
        content,
        createContext("docs/adr/done/ADR-002.md", "ADR-002")
      );

      expect(
        result.downstream.some((ref) => ref.path.includes("task-parser.ts"))
      ).toBe(true);
      expect(
        result.downstream.some((ref) => ref.path.includes("types.ts"))
      ).toBe(true);
    });

    it("ignores non-source links in Implementation section", () => {
      const content = `
# ADR-003

## Implementation

- [Design Doc](docs/design/core/features/trace.md)
- \`packages/core/src/trace/engine.ts\`
- [README](README.md)

## Notes
      `;
      const result = parser.parse(
        content,
        createContext("docs/adr/done/ADR-003.md", "ADR-003")
      );

      // Should include source file
      expect(
        result.downstream.some((ref) => ref.path.includes("engine.ts"))
      ).toBe(true);
      // Should not include non-source files
      expect(
        result.downstream.some((ref) => ref.path.includes("trace.md"))
      ).toBe(false);
      expect(
        result.downstream.some((ref) => ref.path.includes("README"))
      ).toBe(false);
    });

    it("returns empty downstream for ADR without Implementation section", () => {
      const content = `
# ADR-004

## Context

Some context.

## Decision

Some decision.
      `;
      const result = parser.parse(
        content,
        createContext("docs/adr/done/ADR-004.md", "ADR-004")
      );

      expect(result.downstream.length).toBe(0);
    });
  });

  describe("combined extraction", () => {
    it("extracts all reference types from a complete ADR", () => {
      const content = `
# ADR-001: Task File Format

**Status**: done
**Linked CR/FR**: CR-20251206-011
**Linked Design Docs**: docs/design/core/features/task-management.md

## Context

This ADR defines the task file format. It builds on ADR-000-foundation.
See also docs/design/core/scenarios/agent-workflow.md.

## Decision

We will use markdown files with YAML frontmatter.

## Implementation

- \`packages/core/src/tasks/task-parser.ts\`
- \`packages/core/src/tasks/types.ts\`

## Notes

Related to FR-20251207-001.
      `;
      const result = parser.parse(
        content,
        createContext("docs/adr/done/ADR-001.md", "ADR-001")
      );

      // Upstream: CR, design docs, other ADRs
      expect(
        result.upstream.some((ref) => ref.id === "CR-20251206-011")
      ).toBe(true);
      expect(result.upstream.some((ref) => ref.type === "design")).toBe(true);
      expect(
        result.upstream.some((ref) => ref.id === "ADR-000-foundation")
      ).toBe(true);
      expect(
        result.upstream.some((ref) => ref.id === "FR-20251207-001")
      ).toBe(true);

      // Downstream: source files
      expect(
        result.downstream.some((ref) => ref.path.includes("task-parser.ts"))
      ).toBe(true);
      expect(
        result.downstream.some((ref) => ref.path.includes("types.ts"))
      ).toBe(true);
    });

    it("returns empty arrays for minimal ADR", () => {
      const content = `
# ADR-999: Minimal

## Context

No references here.

## Decision

Simple decision.
      `;
      const result = parser.parse(
        content,
        createContext("docs/adr/done/ADR-999.md", "ADR-999")
      );

      expect(result.upstream.length).toBe(0);
      expect(result.downstream.length).toBe(0);
    });
  });
});
