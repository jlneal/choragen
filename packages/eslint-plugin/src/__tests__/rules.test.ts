/**
 * @design-doc docs/design/core/features/eslint-plugin.md
 * @test-type unit
 * @user-intent "Verify ESLint rules correctly detect violations and pass valid code"
 */

import { describe, it, beforeEach, afterEach } from "vitest";
import { RuleTester } from "eslint";
import requireDesignContract from "../rules/require-design-contract.js";
import noMagicNumbersHttp from "../rules/no-magic-numbers-http.js";
import requireAdrReference from "../rules/require-adr-reference.js";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

// Configure RuleTester for ES modules
const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

const tempDirs: string[] = [];

function createTempProject(options: {
  withDesignDoc: boolean;
  designDocPath: string;
}) {
  const root = mkdtempSync(join(tmpdir(), "choragen-contract-"));
  tempDirs.push(root);

  writeFileSync(join(root, "package.json"), "{}");

  if (options.withDesignDoc) {
    const fullDesignDocPath = join(root, options.designDocPath);
    mkdirSync(dirname(fullDesignDocPath), { recursive: true });
    writeFileSync(fullDesignDocPath, "# design doc");
  }

  return root;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("require-design-contract", () => {
  // Note: This rule only applies to files matching /app/api/**/route.ts
  // For files not matching this pattern, the rule returns {} (no checks)

  it("should pass for non-API route files", () => {
    // The rule only checks files in /app/api/ that end with route.ts
    // For other files, it returns early with no errors
    ruleTester.run("require-design-contract", requireDesignContract, {
      valid: [
        {
          // Regular file - not an API route
          code: `export async function GET(request) { return new Response("ok"); }`,
          filename: "/project/src/utils/helper.ts",
        },
        {
          // Test file - excluded by default
          code: `export async function GET(request) { return new Response("ok"); }`,
          filename: "/project/app/api/test/route.test.ts",
        },
        {
          // Debug route - excluded
          code: `export async function GET(request) { return new Response("ok"); }`,
          filename: "/project/app/api/debug/health/route.ts",
        },
        {
          // Dev route - excluded
          code: `export async function GET(request) { return new Response("ok"); }`,
          filename: "/project/app/api/dev/test/route.ts",
        },
      ],
      invalid: [],
    });
  });

  it("should require DesignContract for API route handlers", () => {
    ruleTester.run("require-design-contract", requireDesignContract, {
      valid: [
        {
          // Contract-wrapped export (call expression)
          code: `export const GET = getContract(async (request) => { return new Response("ok"); });`,
          filename: "/project/app/api/users/route.ts",
        },
        {
          // Contract-wrapped POST
          code: `export const POST = postContract(async (request) => { return new Response("ok"); });`,
          filename: "/project/app/api/users/route.ts",
        },
      ],
      invalid: [
        {
          // Direct function export without contract wrapper
          code: `export async function GET(request) { return new Response("ok"); }`,
          filename: "/project/app/api/users/route.ts",
          errors: [{ messageId: "missingContract" }],
        },
        {
          // Direct const export without call expression wrapper
          code: `export const POST = async (request) => { return new Response("ok"); };`,
          filename: "/project/app/api/users/route.ts",
          errors: [{ messageId: "missingContract" }],
        },
      ],
    });
  });

  it("should validate DesignContract configuration", () => {
    ruleTester.run("require-design-contract", requireDesignContract, {
      valid: [],
      invalid: [
        {
          // Empty DesignContract config
          code: `const contract = DesignContract({});`,
          filename: "/project/app/api/users/route.ts",
          errors: [{ messageId: "emptyContract" }],
        },
        {
          // Missing designDoc property
          code: `const contract = DesignContract({ name: "GET" });`,
          filename: "/project/app/api/users/route.ts",
          errors: [{ messageId: "missingDesignDoc" }],
        },
        {
          // Missing name property
          code: `const contract = DesignContract({ designDoc: "docs/design/feature.md" });`,
          filename: "/project/app/api/users/route.ts",
          errors: [{ messageId: "missingName" }],
        },
      ],
    });
  });

  it("should validate existence of referenced design docs", () => {
    const designDocPath = "docs/design/features/users.md";
    const projectWithDoc = createTempProject({
      withDesignDoc: true,
      designDocPath,
    });
    const projectMissingDoc = createTempProject({
      withDesignDoc: false,
      designDocPath,
    });
    const projectSkipValidation = createTempProject({
      withDesignDoc: false,
      designDocPath,
    });

    const code = `const contract = DesignContract({
  designDoc: "${designDocPath}",
  name: "GET",
  preconditions: [],
  postconditions: []
});
export const GET = contract(async () => {});`;

    ruleTester.run("require-design-contract", requireDesignContract, {
      valid: [
        {
          code,
          filename: join(projectWithDoc, "app/api/users/route.ts"),
        },
        {
          code,
          filename: join(projectSkipValidation, "app/api/users/route.ts"),
          options: [{ validateDesignDocExists: false }],
        },
      ],
      invalid: [
        {
          code,
          filename: join(projectMissingDoc, "app/api/users/route.ts"),
          errors: [
            {
              messageId: "designDocNotFound",
              data: { path: designDocPath },
            },
          ],
        },
      ],
    });
  });

  it("should validate template literal designDoc paths", () => {
    const designDocPath = "docs/design/features/template.md";
    const projectWithDoc = createTempProject({
      withDesignDoc: true,
      designDocPath,
    });
    const projectMissingDoc = createTempProject({
      withDesignDoc: false,
      designDocPath,
    });

    const code = `const contract = DesignContract({
  designDoc: \`${designDocPath}\`,
  name: "POST",
  preconditions: [],
  postconditions: []
});
export const POST = contract(async () => {});`;

    ruleTester.run("require-design-contract", requireDesignContract, {
      valid: [
        {
          code,
          filename: join(projectWithDoc, "app/api/template/route.ts"),
        },
      ],
      invalid: [
        {
          code,
          filename: join(projectMissingDoc, "app/api/template/route.ts"),
          errors: [
            {
              messageId: "designDocNotFound",
              data: { path: designDocPath },
            },
          ],
        },
      ],
    });
  });
});

describe("no-magic-numbers-http", () => {
  beforeEach(() => {
    // Reset any state if needed
  });

  it("should allow HttpStatus enum usage", () => {
    ruleTester.run("no-magic-numbers-http", noMagicNumbersHttp, {
      valid: [
        {
          // Using HttpStatus enum
          code: `expect(response.status).toBe(HttpStatus.OK);`,
        },
        {
          // Using HttpStatus enum for NOT_FOUND
          code: `expect(response.status).toBe(HttpStatus.NOT_FOUND);`,
        },
        {
          // Non-HTTP status number
          code: `const count = 42;`,
        },
        {
          // HTTP status code but not in status context
          code: `const year = 200;`,
        },
        {
          // Array index (not HTTP context)
          code: `const items = arr[200];`,
        },
      ],
      invalid: [],
    });
  });

  it("should flag magic numbers in status property", () => {
    ruleTester.run("no-magic-numbers-http", noMagicNumbersHttp, {
      valid: [],
      invalid: [
        {
          // Magic number in status property
          code: `const response = { status: 200 };`,
          errors: [
            {
              messageId: "usedMagicNumber",
              data: { name: "OK", value: "200" },
            },
          ],
        },
        {
          // Magic number 404 in status property
          code: `const response = { status: 404 };`,
          errors: [
            {
              messageId: "usedMagicNumber",
              data: { name: "NOT_FOUND", value: "404" },
            },
          ],
        },
        {
          // Magic number 500 in status property
          code: `const response = { status: 500 };`,
          errors: [
            {
              messageId: "usedMagicNumber",
              data: { name: "INTERNAL_SERVER_ERROR", value: "500" },
            },
          ],
        },
      ],
    });
  });

  it("should flag magic numbers in test assertions", () => {
    ruleTester.run("no-magic-numbers-http", noMagicNumbersHttp, {
      valid: [],
      invalid: [
        {
          // toBe with 200
          code: `expect(response.status).toBe(200);`,
          errors: [
            {
              messageId: "usedMagicNumber",
              data: { name: "OK", value: "200" },
            },
          ],
        },
        {
          // toEqual with 404
          code: `expect(response.status).toEqual(404);`,
          errors: [
            {
              messageId: "usedMagicNumber",
              data: { name: "NOT_FOUND", value: "404" },
            },
          ],
        },
        {
          // toStrictEqual with 201
          code: `expect(response.status).toStrictEqual(201);`,
          errors: [
            {
              messageId: "usedMagicNumber",
              data: { name: "CREATED", value: "201" },
            },
          ],
        },
      ],
    });
  });

  it("should respect ignore option", () => {
    ruleTester.run("no-magic-numbers-http", noMagicNumbersHttp, {
      valid: [
        {
          // 200 is ignored via options
          code: `const response = { status: 200 };`,
          options: [{ ignore: [200] }],
        },
      ],
      invalid: [
        {
          // 404 is not ignored
          code: `const response = { status: 404 };`,
          options: [{ ignore: [200] }],
          errors: [
            {
              messageId: "usedMagicNumber",
              data: { name: "NOT_FOUND", value: "404" },
            },
          ],
        },
      ],
    });
  });
});

describe("require-adr-reference", () => {
  it("should pass for files with ADR reference", () => {
    ruleTester.run("require-adr-reference", requireAdrReference, {
      valid: [
        {
          // ADR: comment format
          code: `// ADR: ADR-001-task-file-format\nconst x = 1;`,
          filename: "/project/src/tasks/parser.ts",
        },
        {
          // @adr JSDoc format
          code: `// @adr ADR-002-governance-schema\nconst x = 1;`,
          filename: "/project/src/governance/checker.ts",
        },
        {
          // Block comment format
          code: `/* ADR: ADR-003-file-locking */\nconst x = 1;`,
          filename: "/project/src/locks/manager.ts",
        },
      ],
      invalid: [],
    });
  });

  it("should exclude test files by default", () => {
    ruleTester.run("require-adr-reference", requireAdrReference, {
      valid: [
        {
          // Test file - excluded by default
          code: `const x = 1;`,
          filename: "/project/src/__tests__/parser.test.ts",
        },
        {
          // Spec file - excluded by default
          code: `const x = 1;`,
          filename: "/project/src/parser.spec.ts",
        },
        {
          // Index file - excluded by default
          code: `export * from "./parser";`,
          filename: "/project/src/index.ts",
        },
      ],
      invalid: [],
    });
  });

  it("should flag files without ADR reference", () => {
    ruleTester.run("require-adr-reference", requireAdrReference, {
      valid: [],
      invalid: [
        {
          // No ADR reference
          code: `const x = 1;`,
          filename: "/project/src/tasks/parser.ts",
          errors: [{ messageId: "missingAdrReference" }],
        },
        {
          // Comment but not ADR format
          code: `// This is a parser\nconst x = 1;`,
          filename: "/project/src/tasks/parser.ts",
          errors: [{ messageId: "missingAdrReference" }],
        },
        {
          // Invalid ADR format (missing number)
          code: `// ADR: task-file-format\nconst x = 1;`,
          filename: "/project/src/tasks/parser.ts",
          errors: [{ messageId: "missingAdrReference" }],
        },
      ],
    });
  });

  it("should respect custom exclude patterns", () => {
    ruleTester.run("require-adr-reference", requireAdrReference, {
      valid: [
        {
          // Custom excluded pattern
          code: `const x = 1;`,
          filename: "/project/src/generated/types.ts",
          options: [{ excludePatterns: ["**/generated/**"] }],
        },
      ],
      invalid: [
        {
          // Not matching custom exclude pattern
          code: `const x = 1;`,
          filename: "/project/src/tasks/parser.ts",
          options: [{ excludePatterns: ["**/generated/**"] }],
          errors: [{ messageId: "missingAdrReference" }],
        },
      ],
    });
  });
});
