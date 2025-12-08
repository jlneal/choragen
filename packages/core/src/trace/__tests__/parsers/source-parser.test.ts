/**
 * @design-doc docs/design/core/features/trace-command.md
 * @test-type unit
 * @user-intent "Verify source file parser correctly extracts ADR, design doc, and import references"
 *
 * Tests for the SourceParser that extracts traceability links from TypeScript/JavaScript files.
 */

import { describe, it, expect } from "vitest";
import { SourceParser } from "../../parsers/source-parser.js";
import type { ParseContext } from "../../parsers/base-parser.js";

describe("SourceParser", () => {
  const parser = new SourceParser();

  const createContext = (
    filePath: string,
    artifactId?: string
  ): ParseContext => ({
    projectRoot: "/project",
    filePath,
    artifactType: "source",
    artifactId,
  });

  describe("canParse", () => {
    it("can parse source files", () => {
      const context = createContext("packages/core/src/index.ts");
      expect(parser.canParse(context)).toBe(true);
    });

    it("can parse test files", () => {
      const context: ParseContext = {
        ...createContext("packages/core/src/__tests__/test.ts"),
        artifactType: "test",
      };
      expect(parser.canParse(context)).toBe(true);
    });

    it("supports TypeScript extensions", () => {
      expect(parser.supportedExtensions).toContain(".ts");
      expect(parser.supportedExtensions).toContain(".tsx");
      expect(parser.supportedExtensions).toContain(".mts");
    });

    it("supports JavaScript extensions", () => {
      expect(parser.supportedExtensions).toContain(".js");
      expect(parser.supportedExtensions).toContain(".jsx");
      expect(parser.supportedExtensions).toContain(".mjs");
    });
  });

  describe("ADR reference extraction", () => {
    it("extracts ADR references from // comments", () => {
      const content = `
        // ADR: ADR-001-task-file-format
        export function doSomething() {}
      `;
      const result = parser.parse(content, createContext("src/index.ts"));

      expect(result.upstream.length).toBe(1);
      expect(result.upstream[0].type).toBe("adr");
      expect(result.upstream[0].id).toBe("ADR-001-task-file-format");
    });

    it("extracts ADR references from JSDoc comments", () => {
      const content = `
        /**
         * Some function
         * ADR: ADR-002-governance
         */
        export function doSomething() {}
      `;
      const result = parser.parse(content, createContext("src/index.ts"));

      expect(result.upstream.some((ref) => ref.id === "ADR-002-governance")).toBe(
        true
      );
    });

    it("extracts ADR references from @adr tags", () => {
      const content = `
        /**
         * @adr ADR-003-file-locking
         */
        export function doSomething() {}
      `;
      const result = parser.parse(content, createContext("src/index.ts"));

      expect(
        result.upstream.some((ref) => ref.id === "ADR-003-file-locking")
      ).toBe(true);
    });

    it("extracts bare ADR IDs", () => {
      const content = `
        // Implements ADR-001 requirements
        export function doSomething() {}
      `;
      const result = parser.parse(content, createContext("src/index.ts"));

      expect(result.upstream.some((ref) => ref.id === "ADR-001")).toBe(true);
    });

    it("deduplicates ADR references", () => {
      const content = `
        // ADR: ADR-001-task-file-format
        // See also ADR-001-task-file-format
        // And ADR-001-task-file-format again
      `;
      const result = parser.parse(content, createContext("src/index.ts"));

      const adr001Refs = result.upstream.filter((ref) =>
        ref.id.startsWith("ADR-001")
      );
      expect(adr001Refs.length).toBe(1);
    });

    it("extracts multiple different ADR references", () => {
      const content = `
        // ADR: ADR-001-task-file-format
        // ADR: ADR-002-governance
        // ADR: ADR-003-file-locking
      `;
      const result = parser.parse(content, createContext("src/index.ts"));

      expect(result.upstream.length).toBeGreaterThanOrEqual(3);
      expect(result.upstream.some((ref) => ref.id.includes("ADR-001"))).toBe(
        true
      );
      expect(result.upstream.some((ref) => ref.id.includes("ADR-002"))).toBe(
        true
      );
      expect(result.upstream.some((ref) => ref.id.includes("ADR-003"))).toBe(
        true
      );
    });
  });

  describe("@design-doc reference extraction", () => {
    it("extracts @design-doc references", () => {
      const content = `
        /**
         * @design-doc docs/design/core/features/trace-command.md
         */
        export class TraceEngine {}
      `;
      const result = parser.parse(content, createContext("src/trace.ts"));

      expect(result.upstream.some((ref) => ref.type === "design")).toBe(true);
      expect(
        result.upstream.some((ref) =>
          ref.path.includes("trace-command.md")
        )
      ).toBe(true);
    });

    it("extracts multiple @design-doc references", () => {
      const content = `
        /**
         * @design-doc docs/design/core/features/feature-a.md
         * @design-doc docs/design/core/features/feature-b.md
         */
        export class Combined {}
      `;
      const result = parser.parse(content, createContext("src/combined.ts"));

      const designRefs = result.upstream.filter((ref) => ref.type === "design");
      expect(designRefs.length).toBe(2);
    });

    it("deduplicates @design-doc references", () => {
      const content = `
        /**
         * @design-doc docs/design/core/features/trace.md
         */
        export class A {}

        /**
         * @design-doc docs/design/core/features/trace.md
         */
        export class B {}
      `;
      const result = parser.parse(content, createContext("src/index.ts"));

      const traceRefs = result.upstream.filter((ref) =>
        ref.path.includes("trace.md")
      );
      expect(traceRefs.length).toBe(1);
    });
  });

  describe("CR/FR reference extraction", () => {
    it("extracts CR references", () => {
      const content = `
        // Implements CR-20251206-011
        export function feature() {}
      `;
      const result = parser.parse(content, createContext("src/feature.ts"));

      expect(result.upstream.some((ref) => ref.type === "request")).toBe(true);
      expect(
        result.upstream.some((ref) => ref.id === "CR-20251206-011")
      ).toBe(true);
    });

    it("extracts FR references", () => {
      const content = `
        // Fixes FR-20251207-002
        export function bugfix() {}
      `;
      const result = parser.parse(content, createContext("src/bugfix.ts"));

      expect(result.upstream.some((ref) => ref.type === "request")).toBe(true);
      expect(
        result.upstream.some((ref) => ref.id === "FR-20251207-002")
      ).toBe(true);
    });
  });

  describe("import extraction", () => {
    it("extracts relative imports", () => {
      const content = `
        import { ChainManager } from './chain-manager';
        export function useChain() {}
      `;
      const result = parser.parse(
        content,
        createContext("packages/core/src/index.ts")
      );

      expect(result.downstream.some((ref) => ref.type === "source")).toBe(true);
    });

    it("extracts parent directory imports", () => {
      const content = `
        import { utils } from '../utils/helpers';
        export function useUtils() {}
      `;
      const result = parser.parse(
        content,
        createContext("packages/core/src/tasks/manager.ts")
      );

      expect(result.downstream.some((ref) => ref.type === "source")).toBe(true);
    });

    it("ignores external package imports", () => {
      const content = `
        import { describe, it } from 'vitest';
        import path from 'node:path';
        import fs from 'fs';
      `;
      const result = parser.parse(content, createContext("src/test.ts"));

      // Should not include external packages
      expect(
        result.downstream.some((ref) => ref.path.includes("vitest"))
      ).toBe(false);
      expect(
        result.downstream.some((ref) => ref.path.includes("node:"))
      ).toBe(false);
    });

    it("extracts namespace imports", () => {
      const content = `
        import * as helpers from './helpers';
      `;
      const result = parser.parse(
        content,
        createContext("packages/core/src/index.ts")
      );

      expect(result.downstream.length).toBeGreaterThan(0);
    });

    it("extracts require statements", () => {
      const content = `
        const utils = require('./utils');
      `;
      const result = parser.parse(
        content,
        createContext("packages/core/src/index.ts")
      );

      expect(result.downstream.some((ref) => ref.type === "source")).toBe(true);
    });

    it("extracts dynamic imports", () => {
      const content = `
        const module = await import('./lazy-module');
      `;
      const result = parser.parse(
        content,
        createContext("packages/core/src/index.ts")
      );

      expect(result.downstream.some((ref) => ref.type === "source")).toBe(true);
    });

    it("handles .js extension imports (ESM)", () => {
      const content = `
        import { foo } from './bar.js';
      `;
      const result = parser.parse(
        content,
        createContext("packages/core/src/index.ts")
      );

      // Should normalize .js to .ts
      expect(
        result.downstream.some((ref) => ref.path.includes(".ts"))
      ).toBe(true);
    });

    it("deduplicates import references", () => {
      const content = `
        import { a } from './utils';
        import { b } from './utils';
        const c = require('./utils');
      `;
      const result = parser.parse(
        content,
        createContext("packages/core/src/index.ts")
      );

      const utilsRefs = result.downstream.filter((ref) =>
        ref.path.includes("utils")
      );
      expect(utilsRefs.length).toBe(1);
    });
  });

  describe("combined extraction", () => {
    it("extracts all reference types from a real-world file", () => {
      const content = `
        /**
         * TraceEngine - Core orchestrator for traceability traversal
         *
         * @design-doc docs/design/core/features/trace-command.md
         * ADR: ADR-001-task-file-format (traceability patterns)
         */

        import * as fs from "node:fs/promises";
        import * as path from "node:path";
        import type { TraceResult } from "./types.js";
        import { TraceCache } from "./cache.js";

        // Implements CR-20251206-011
        export class TraceEngine {
          // ...
        }
      `;
      const result = parser.parse(
        content,
        createContext("packages/core/src/trace/trace-engine.ts")
      );

      // Should have ADR reference
      expect(result.upstream.some((ref) => ref.type === "adr")).toBe(true);

      // Should have design doc reference
      expect(result.upstream.some((ref) => ref.type === "design")).toBe(true);

      // Should have CR reference
      expect(result.upstream.some((ref) => ref.type === "request")).toBe(true);

      // Should have local imports (types.js, cache.js)
      expect(result.downstream.some((ref) => ref.type === "source")).toBe(true);
    });

    it("returns empty arrays for file with no references", () => {
      const content = `
        export const PI = 3.14159;
        export function add(a: number, b: number) {
          return a + b;
        }
      `;
      const result = parser.parse(content, createContext("src/math.ts"));

      expect(result.upstream.length).toBe(0);
      expect(result.downstream.length).toBe(0);
    });
  });
});
