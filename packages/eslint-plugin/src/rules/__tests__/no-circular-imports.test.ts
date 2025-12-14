/**
 * Tests for no-circular-imports rule
 *
 * @design-doc docs/design/core/features/eslint-plugin.md
 * @test-type unit
 * @user-intent "Verify rule skeleton is wired with defaults for circular import detection"
 *
 * ADR: ADR-002-governance-schema
 * CR: CR-20251214-002
 */

import { describe, it, expect, afterAll } from "vitest";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";
import rule from "../no-circular-imports.js";
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: tsParser,
  },
});

describe("no-circular-imports", () => {
  it("should be a valid ESLint rule with defaults", () => {
    expect(rule).toBeDefined();
    expect(rule.meta).toBeDefined();
    expect(rule.meta?.schema).toBeDefined();
    expect(rule.create).toBeInstanceOf(Function);
  });

  ruleTester.run("no-circular-imports", rule, {
    valid: [
      {
        code: `import { helper } from "./utils";`,
        filename: "/project/src/index.ts",
      },
    ],
    invalid: [],
  });
});

describe("no-circular-imports type import filtering", () => {
  const tempDirs: string[] = [];

  afterAll(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("ignores type-only imports when ignoreTypeImports is true", () => {
    const { fileA, fileB } = createTypeCycleFixture(tempDirs);

    ruleTester.run("no-circular-imports", rule, {
      valid: [
        {
          code: `import type { B } from "./b";`,
          filename: fileA,
          options: [{ ignoreTypeImports: true }],
        },
        {
          code: `import type { A } from "./a";`,
          filename: fileB,
          options: [{ ignoreTypeImports: true }],
        },
      ],
      invalid: [],
    });
  });

  it("includes type-only imports when ignoreTypeImports is false", () => {
    const { fileA, fileB } = createTypeCycleFixture(tempDirs);

    ruleTester.run("no-circular-imports", rule, {
      valid: [
        {
          code: `import type { B } from "./b";`,
          filename: fileA,
          options: [{ ignoreTypeImports: false }],
        },
      ],
      invalid: [
        {
          code: `import type { A } from "./a";`,
          filename: fileB,
          options: [{ ignoreTypeImports: false }],
          errors: [{ messageId: "circularImport" }],
        },
      ],
    });
  });
});

function createTypeCycleFixture(tempDirs: string[]) {
  const baseDir = mkdtempSync(join(tmpdir(), "no-circular-imports-"));
  tempDirs.push(baseDir);
  const srcDir = join(baseDir, "src");
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(join(baseDir, "package.json"), "{}", "utf8");

  const fileA = join(srcDir, "a.ts");
  const fileB = join(srcDir, "b.ts");

  writeFileSync(fileA, `import type { B } from "./b";\nexport type A = { b: B };`, "utf8");
  writeFileSync(fileB, `import type { A } from "./a";\nexport type B = { a: A };`, "utf8");

  return { fileA, fileB };
}

describe("no-circular-imports cycle detection", () => {
  const tempDirs: string[] = [];

  afterAll(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("detects direct circular imports", () => {
    const { fileA } = createDirectCycleFixture(tempDirs);

    ruleTester.run("no-circular-imports", rule, {
      valid: [],
      invalid: [
        {
          code: `import { b } from "./b";`,
          filename: fileA,
          errors: [
            {
              messageId: "circularImport",
              data: {
                chain: expect.stringContaining("direct/a.ts -> direct/b.ts -> direct/a.ts"),
              },
            },
          ],
        },
      ],
    });
  });

  it("detects transitive circular imports", () => {
    const { fileA } = createTransitiveCycleFixture(tempDirs);

    ruleTester.run("no-circular-imports", rule, {
      valid: [],
      invalid: [
        {
          code: `import { b } from "./b";`,
          filename: fileA,
          errors: [
            {
              messageId: "circularImport",
              data: {
                chain: expect.stringContaining(
                  "transitive/a.ts -> transitive/b.ts -> transitive/c.ts -> transitive/a.ts"
                ),
              },
            },
          ],
        },
      ],
    });
  });

  it("respects maxDepth and does not report beyond limit", () => {
    const { files } = createDeepCycleFixture(tempDirs);

    ruleTester.run("no-circular-imports", rule, {
      valid: [
        {
          code: `import { next } from "./b";`,
          filename: files[0],
          options: [{ maxDepth: 1 }],
        },
        {
          code: `import { next } from "./c";`,
          filename: files[1],
          options: [{ maxDepth: 1 }],
        },
        {
          code: `import { next } from "./a";`,
          filename: files[2],
          options: [{ maxDepth: 1 }],
        },
      ],
      invalid: [],
    });
  });

  it("ignores external/node_modules imports", () => {
    const { fileA } = createExternalImportFixture(tempDirs);

    ruleTester.run("no-circular-imports", rule, {
      valid: [
        {
          code: `import something from "react";`,
          filename: fileA,
        },
      ],
      invalid: [],
    });
  });

  it("allows valid code with no cycles", () => {
    const { fileA, fileB, fileC } = createAcyclicFixture(tempDirs);

    ruleTester.run("no-circular-imports", rule, {
      valid: [
        {
          code: `import { b } from "./b";`,
          filename: fileA,
        },
        {
          code: `import { c } from "./c";`,
          filename: fileB,
        },
        {
          code: `export const c = 3;`,
          filename: fileC,
        },
      ],
      invalid: [],
    });
  });
});

function createDirectCycleFixture(tempDirs: string[]) {
  const baseDir = mkdtempSync(join(tmpdir(), "no-circular-direct-"));
  tempDirs.push(baseDir);
  const srcDir = join(baseDir, "src", "direct");
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(join(baseDir, "package.json"), "{}", "utf8");

  const fileA = join(srcDir, "a.ts");
  const fileB = join(srcDir, "b.ts");

  writeFileSync(fileA, `import { b } from "./b";\nexport const a = b;`, "utf8");
  writeFileSync(fileB, `import { a } from "./a";\nexport const b = a;`, "utf8");

  return { fileA, fileB };
}

function createTransitiveCycleFixture(tempDirs: string[]) {
  const baseDir = mkdtempSync(join(tmpdir(), "no-circular-transitive-"));
  tempDirs.push(baseDir);
  const srcDir = join(baseDir, "src", "transitive");
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(join(baseDir, "package.json"), "{}", "utf8");

  const fileA = join(srcDir, "a.ts");
  const fileB = join(srcDir, "b.ts");
  const fileC = join(srcDir, "c.ts");

  writeFileSync(fileA, `import { b } from "./b";\nexport const a = b;`, "utf8");
  writeFileSync(fileB, `import { c } from "./c";\nexport const b = c;`, "utf8");
  writeFileSync(fileC, `import { a } from "./a";\nexport const c = a;`, "utf8");

  return { fileA, fileB, fileC };
}

function createDeepCycleFixture(tempDirs: string[]) {
  const baseDir = mkdtempSync(join(tmpdir(), "no-circular-depth-"));
  tempDirs.push(baseDir);
  const srcDir = join(baseDir, "src", "deep");
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(join(baseDir, "package.json"), "{}", "utf8");

  const files = [
    join(srcDir, "a.ts"),
    join(srcDir, "b.ts"),
    join(srcDir, "c.ts"),
  ];

  writeFileSync(files[0], `import { next } from "./b";\nexport const a = next;`, "utf8");
  writeFileSync(files[1], `import { next } from "./c";\nexport const next = "b";`, "utf8");
  writeFileSync(files[2], `import { next } from "./a";\nexport const next = "c";`, "utf8");

  return { files };
}

function createExternalImportFixture(tempDirs: string[]) {
  const baseDir = mkdtempSync(join(tmpdir(), "no-circular-external-"));
  tempDirs.push(baseDir);
  const srcDir = join(baseDir, "src", "external");
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(join(baseDir, "package.json"), "{}", "utf8");

  const fileA = join(srcDir, "a.ts");
  writeFileSync(fileA, `import something from "react";\nexport const a = something;`, "utf8");

  return { fileA };
}

function createAcyclicFixture(tempDirs: string[]) {
  const baseDir = mkdtempSync(join(tmpdir(), "no-circular-acyclic-"));
  tempDirs.push(baseDir);
  const srcDir = join(baseDir, "src", "acyclic");
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(join(baseDir, "package.json"), "{}", "utf8");

  const fileA = join(srcDir, "a.ts");
  const fileB = join(srcDir, "b.ts");
  const fileC = join(srcDir, "c.ts");

  writeFileSync(fileA, `import { b } from "./b";\nexport const a = b;`, "utf8");
  writeFileSync(fileB, `import { c } from "./c";\nexport const b = c;`, "utf8");
  writeFileSync(fileC, `export const c = 3;`, "utf8");

  return { fileA, fileB, fileC };
}
