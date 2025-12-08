/**
 * @design-doc docs/design/core/features/trace-command.md
 * @test-type unit
 * @user-intent "Verify regex patterns correctly extract traceability references from various file formats"
 *
 * Tests for regex patterns used in link discovery.
 * These patterns are critical for correct traceability extraction.
 */

import { describe, it, expect } from "vitest";
import {
  ADR_COMMENT_PATTERN,
  ADR_PATH_PATTERN,
  ADR_ID_PATTERN,
  CR_ID_PATTERN,
  FR_ID_PATTERN,
  LINKED_CR_FR_PATTERN,
  REQUEST_ID_PATTERN,
  DESIGN_DOC_PATH_PATTERN,
  DESIGN_DOC_TAG_PATTERN,
  LINKED_DESIGN_DOCS_PATTERN,
  CHAIN_ID_PATTERN,
  CHAIN_METADATA_PATTERN,
  TASK_ID_PATTERN,
  IMPORT_PATTERN,
  REQUIRE_PATTERN,
  DYNAMIC_IMPORT_PATTERN,
  MARKDOWN_LINK_PATTERN,
  DOCS_LINK_PATTERN,
  IMPLEMENTATION_SECTION_PATTERN,
  LINKED_ADRS_SECTION_PATTERN,
  LINKED_REQUEST_SECTION_PATTERN,
  freshPattern,
  extractMatches,
  extractCaptureGroups,
} from "../../parsers/patterns.js";

describe("patterns", () => {
  describe("ADR_COMMENT_PATTERN", () => {
    it("matches // ADR: comments", () => {
      const content = "// ADR: ADR-001-task-file-format";
      const pattern = freshPattern(ADR_COMMENT_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("ADR-001-task-file-format");
    });

    it("matches * ADR: comments (JSDoc style)", () => {
      const content = "* ADR: ADR-002-governance-model";
      const pattern = freshPattern(ADR_COMMENT_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("ADR-002-governance-model");
    });

    it("matches @adr JSDoc tag", () => {
      const content = "/* @adr ADR-003-file-locking */";
      const pattern = freshPattern(ADR_COMMENT_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("ADR-003-file-locking");
    });

    it("matches # ADR: comments (shell/python style)", () => {
      const content = "# ADR: ADR-004-metrics";
      const pattern = freshPattern(ADR_COMMENT_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("ADR-004-metrics");
    });

    it("matches ADR IDs without suffix", () => {
      const content = "// ADR: ADR-001";
      const pattern = freshPattern(ADR_COMMENT_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("ADR-001");
    });

    it("extracts multiple ADR references", () => {
      const content = `
        // ADR: ADR-001-task-file-format
        * ADR: ADR-002-governance
      `;
      const matches = extractMatches(content, ADR_COMMENT_PATTERN);
      expect(matches.length).toBe(2);
    });
  });

  describe("ADR_PATH_PATTERN", () => {
    it("matches ADR paths in todo", () => {
      const content = "docs/adr/todo/ADR-001-task-file-format.md";
      const pattern = freshPattern(ADR_PATH_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("ADR-001-task-file-format");
    });

    it("matches ADR paths in done", () => {
      const content = "docs/adr/done/ADR-002-governance.md";
      const pattern = freshPattern(ADR_PATH_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("ADR-002-governance");
    });

    it("matches ADR paths in archive", () => {
      const content = "docs/adr/archive/ADR-003-deprecated.md";
      const pattern = freshPattern(ADR_PATH_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("ADR-003-deprecated");
    });
  });

  describe("ADR_ID_PATTERN", () => {
    it("matches bare ADR IDs", () => {
      const content = "See ADR-001 for details";
      const pattern = freshPattern(ADR_ID_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![0]).toBe("ADR-001");
    });

    it("matches ADR IDs with suffix", () => {
      const content = "Implements ADR-001-task-file-format";
      const pattern = freshPattern(ADR_ID_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![0]).toBe("ADR-001-task-file-format");
    });
  });

  describe("CR_ID_PATTERN", () => {
    it("matches CR IDs", () => {
      const content = "CR-20251206-011";
      const pattern = freshPattern(CR_ID_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![0]).toBe("CR-20251206-011");
      expect(match![1]).toBe("20251206");
      expect(match![2]).toBe("011");
    });

    it("matches CR IDs in context", () => {
      const content = "**Linked CR/FR**: CR-20251205-001";
      const pattern = freshPattern(CR_ID_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![0]).toBe("CR-20251205-001");
    });
  });

  describe("FR_ID_PATTERN", () => {
    it("matches FR IDs", () => {
      const content = "FR-20251207-002";
      const pattern = freshPattern(FR_ID_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![0]).toBe("FR-20251207-002");
      expect(match![1]).toBe("20251207");
      expect(match![2]).toBe("002");
    });
  });

  describe("LINKED_CR_FR_PATTERN", () => {
    it("matches Linked CR/FR field with CR", () => {
      const content = "**Linked CR/FR**: CR-20251206-011";
      const match = content.match(LINKED_CR_FR_PATTERN);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("CR-20251206-011");
    });

    it("matches Linked CR/FR field with FR", () => {
      const content = "**Linked CR/FR**: FR-20251207-002";
      const match = content.match(LINKED_CR_FR_PATTERN);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("FR-20251207-002");
    });
  });

  describe("REQUEST_ID_PATTERN", () => {
    it("matches both CR and FR IDs", () => {
      const content = "CR-20251206-011 and FR-20251207-002";
      const matches = extractMatches(content, REQUEST_ID_PATTERN);
      expect(matches.length).toBe(2);
      expect(matches[0]).toBe("CR-20251206-011");
      expect(matches[1]).toBe("FR-20251207-002");
    });
  });

  describe("DESIGN_DOC_PATH_PATTERN", () => {
    it("matches feature design doc paths", () => {
      const content = "docs/design/core/features/task-chain-management.md";
      const pattern = freshPattern(DESIGN_DOC_PATH_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("task-chain-management");
    });

    it("matches scenario design doc paths", () => {
      const content = "docs/design/core/scenarios/control-agent-workflow.md";
      const pattern = freshPattern(DESIGN_DOC_PATH_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("control-agent-workflow");
    });

    it("matches enhancement design doc paths", () => {
      const content = "docs/design/core/enhancements/trace-improvements.md";
      const pattern = freshPattern(DESIGN_DOC_PATH_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("trace-improvements");
    });

    it("matches paths without core/ prefix", () => {
      const content = "docs/design/features/simple-feature.md";
      const pattern = freshPattern(DESIGN_DOC_PATH_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("simple-feature");
    });
  });

  describe("DESIGN_DOC_TAG_PATTERN", () => {
    it("matches @design-doc JSDoc tag", () => {
      const content = "@design-doc docs/design/core/features/trace-command.md";
      const pattern = freshPattern(DESIGN_DOC_TAG_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("docs/design/core/features/trace-command.md");
    });
  });

  describe("LINKED_DESIGN_DOCS_PATTERN", () => {
    it("matches Linked Design Docs field", () => {
      const content =
        "**Linked Design Docs**: docs/design/core/features/task-management.md";
      const match = content.match(LINKED_DESIGN_DOCS_PATTERN);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("docs/design/core/features/task-management.md");
    });
  });

  describe("CHAIN_ID_PATTERN", () => {
    it("matches chain IDs", () => {
      const content = "CHAIN-033-trace-command";
      const pattern = freshPattern(CHAIN_ID_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![0]).toBe("CHAIN-033-trace-command");
      expect(match![1]).toBe("033");
      expect(match![2]).toBe("trace-command");
    });
  });

  describe("CHAIN_METADATA_PATTERN", () => {
    it("matches chain metadata YAML files", () => {
      const content = "docs/tasks/.chains/CHAIN-033-trace-command.yaml";
      const pattern = freshPattern(CHAIN_METADATA_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("CHAIN-033-trace-command");
    });

    it("matches chain metadata JSON files", () => {
      const content = "docs/tasks/.chains/CHAIN-034-impl.json";
      const pattern = freshPattern(CHAIN_METADATA_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("CHAIN-034-impl");
    });
  });

  describe("TASK_ID_PATTERN", () => {
    it("matches task IDs", () => {
      const content = "002-link-discovery";
      const pattern = freshPattern(TASK_ID_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("002");
      expect(match![2]).toBe("link-discovery");
    });
  });

  describe("IMPORT_PATTERN", () => {
    it("matches named imports", () => {
      const content = "import { ChainManager } from './chain-manager'";
      const pattern = freshPattern(IMPORT_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("./chain-manager");
    });

    it("matches default imports", () => {
      const content = "import fs from 'node:fs'";
      const pattern = freshPattern(IMPORT_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("node:fs");
    });

    it("matches namespace imports", () => {
      const content = "import * as path from 'node:path'";
      const pattern = freshPattern(IMPORT_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("node:path");
    });

    it("matches imports with double quotes", () => {
      const content = 'import { foo } from "./bar"';
      const pattern = freshPattern(IMPORT_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("./bar");
    });
  });

  describe("REQUIRE_PATTERN", () => {
    it("matches require statements", () => {
      const content = "const fs = require('node:fs')";
      const pattern = freshPattern(REQUIRE_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("node:fs");
    });

    it("matches require with double quotes", () => {
      const content = 'const path = require("node:path")';
      const pattern = freshPattern(REQUIRE_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("node:path");
    });
  });

  describe("DYNAMIC_IMPORT_PATTERN", () => {
    it("matches dynamic imports", () => {
      const content = "await import('./module')";
      const pattern = freshPattern(DYNAMIC_IMPORT_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("./module");
    });

    it("matches dynamic imports without await", () => {
      const content = "import('./lazy-module')";
      const pattern = freshPattern(DYNAMIC_IMPORT_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("./lazy-module");
    });
  });

  describe("MARKDOWN_LINK_PATTERN", () => {
    it("matches markdown links", () => {
      const content = "[Link Text](path/to/file.md)";
      const pattern = freshPattern(MARKDOWN_LINK_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("Link Text");
      expect(match![2]).toBe("path/to/file.md");
    });

    it("matches multiple markdown links", () => {
      const content = "[First](a.md) and [Second](b.md)";
      const groups = extractCaptureGroups(content, MARKDOWN_LINK_PATTERN);
      expect(groups.length).toBe(2);
      expect(groups[0][0]).toBe("First");
      expect(groups[0][1]).toBe("a.md");
      expect(groups[1][0]).toBe("Second");
      expect(groups[1][1]).toBe("b.md");
    });
  });

  describe("DOCS_LINK_PATTERN", () => {
    it("matches links to docs directory", () => {
      const content = "[Design Doc](docs/design/core/features/trace.md)";
      const pattern = freshPattern(DOCS_LINK_PATTERN);
      const match = pattern.exec(content);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("Design Doc");
      expect(match![2]).toBe("docs/design/core/features/trace.md");
    });

    it("does not match non-docs links", () => {
      const content = "[Source](packages/core/src/index.ts)";
      const pattern = freshPattern(DOCS_LINK_PATTERN);
      const match = pattern.exec(content);
      expect(match).toBeNull();
    });
  });

  describe("IMPLEMENTATION_SECTION_PATTERN", () => {
    it("matches Implementation section", () => {
      const content = `
## Implementation

- \`packages/core/src/trace/trace-engine.ts\`
- \`packages/core/src/trace/cache.ts\`

## Next Section
`;
      const match = content.match(IMPLEMENTATION_SECTION_PATTERN);
      expect(match).not.toBeNull();
      expect(match![1]).toContain("trace-engine.ts");
      expect(match![1]).toContain("cache.ts");
    });
  });

  describe("LINKED_ADRS_SECTION_PATTERN", () => {
    it("matches Linked ADRs section", () => {
      const content = `
## Linked ADRs

- ADR-001-task-file-format
- ADR-002-governance

## Next Section
`;
      const match = content.match(LINKED_ADRS_SECTION_PATTERN);
      expect(match).not.toBeNull();
      expect(match![1]).toContain("ADR-001");
      expect(match![1]).toContain("ADR-002");
    });
  });

  describe("LINKED_REQUEST_SECTION_PATTERN", () => {
    it("matches Linked Request section", () => {
      const content = `
## Linked Request

CR-20251206-011

## Next Section
`;
      const match = content.match(LINKED_REQUEST_SECTION_PATTERN);
      expect(match).not.toBeNull();
      expect(match![1]).toContain("CR-20251206-011");
    });
  });

  describe("helper functions", () => {
    describe("freshPattern", () => {
      it("creates independent regex instances", () => {
        const pattern1 = freshPattern(ADR_ID_PATTERN);
        const pattern2 = freshPattern(ADR_ID_PATTERN);

        const content = "ADR-001 and ADR-002";
        pattern1.exec(content);

        // pattern2 should start fresh, not affected by pattern1
        const match = pattern2.exec(content);
        expect(match![0]).toBe("ADR-001");
      });
    });

    describe("extractMatches", () => {
      it("extracts all matches from content", () => {
        const content = "ADR-001, ADR-002, ADR-003";
        const matches = extractMatches(content, ADR_ID_PATTERN);
        expect(matches).toEqual(["ADR-001", "ADR-002", "ADR-003"]);
      });

      it("returns empty array for no matches", () => {
        const content = "no ADRs here";
        const matches = extractMatches(content, ADR_ID_PATTERN);
        expect(matches).toEqual([]);
      });
    });

    describe("extractCaptureGroups", () => {
      it("extracts capture groups from matches", () => {
        const content = "CR-20251206-011 and CR-20251207-002";
        const groups = extractCaptureGroups(content, CR_ID_PATTERN);
        expect(groups.length).toBe(2);
        expect(groups[0]).toEqual(["20251206", "011"]);
        expect(groups[1]).toEqual(["20251207", "002"]);
      });

      it("returns empty array for no matches", () => {
        const content = "no CRs here";
        const groups = extractCaptureGroups(content, CR_ID_PATTERN);
        expect(groups).toEqual([]);
      });
    });
  });
});
