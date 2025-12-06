# Agent Guidelines for Choragen

These guidelines apply to the entire repository.

---

## Common Patterns (Copy-Paste Ready)

**Use these patterns to avoid lint errors. Copy directly into your code.**

### HTTP Status Codes in Tests

```typescript
import { HttpStatus } from "@choragen/contracts";

// ✅ CORRECT: Use enum constants
expect(response.status).toBe(HttpStatus.OK);           // 200
expect(response.status).toBe(HttpStatus.CREATED);      // 201
expect(response.status).toBe(HttpStatus.NO_CONTENT);   // 204
expect(response.status).toBe(HttpStatus.BAD_REQUEST);  // 400
expect(response.status).toBe(HttpStatus.UNAUTHORIZED); // 401
expect(response.status).toBe(HttpStatus.NOT_FOUND);    // 404
expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR); // 500

// ❌ WRONG: Magic numbers trigger lint errors
expect(response.status).toBe(404);
```

### API Error Handling

```typescript
import { ApiError, HttpStatus } from "@choragen/contracts";

// ✅ CORRECT: Use HttpStatus enum
throw new ApiError("Not found", HttpStatus.NOT_FOUND);
throw new ApiError("Invalid input", HttpStatus.BAD_REQUEST);
throw new ApiError("Unauthorized", HttpStatus.UNAUTHORIZED);

// ❌ WRONG: Magic number
throw new ApiError("Not found", 404);
```

### Design Contracts for API Routes

```typescript
import { DesignContract, ApiError, HttpStatus } from "@choragen/contracts";

export const GET = DesignContract({
  designDoc: "docs/design/core/features/task-management.md",
  handler: async (request: Request) => {
    // Implementation
    return Response.json({ data: result }, { status: HttpStatus.OK });
  },
});

export const POST = DesignContract({
  designDoc: "docs/design/core/features/governance-enforcement.md",
  handler: async (request: Request) => {
    const body = await request.json();

    if (!body.action) {
      throw new ApiError("Missing action", HttpStatus.BAD_REQUEST);
    }

    return Response.json({ success: true }, { status: HttpStatus.CREATED });
  },
});
```

### Non-HTTP Magic Numbers

```typescript
// ✅ CORRECT: Define semantic constants
const EXPECTED_TASK_COUNT = 5;
const DEFAULT_TIMEOUT_MS = 3000;
const MAX_RETRIES = 3;

expect(tasks.length).toBe(EXPECTED_TASK_COUNT);

// ❌ WRONG: Unexplained numbers
expect(tasks.length).toBe(5);
```

### Test File Metadata

```typescript
/**
 * @design-doc docs/design/core/features/task-management.md
 * @test-type unit
 */
describe("TaskManager", () => {
  // tests
});
```

---

## Project Overview

Choragen is a framework for agentic software development. It provides task chains, governance, and coordination primitives that transform stateless language models into stateful, accountable workers.

## Documentation Structure

```
docs/
├── requests/           # Change and fix requests
│   ├── change-requests/
│   │   ├── todo/
│   │   ├── doing/
│   │   └── done/
│   └── fix-requests/
│       ├── todo/
│       ├── doing/
│       └── done/
│
├── adr/                # Architecture Decision Records
│   ├── todo/
│   ├── doing/
│   ├── done/
│   └── archive/
│
├── design/             # Design documentation
│   └── core/
│       ├── scenarios/
│       ├── features/
│       └── enhancements/
│
└── architecture.md     # System overview
```

## Traceability Chain

Every artifact links backward:

```
Request (CR/FR)
  → Design Doc (WHAT)
    → ADR (HOW)
      → Implementation (Code)
        → Tests
```

## Commit Message Format

```
<type>(<scope>): <description>

[body]

[CR-xxx | FR-xxx]
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

## Task Completion Checklist

Before marking any task complete:

```bash
# 1. Build
pnpm build

# 2. Test
pnpm --filter @choragen/core test

# 3. Type check
pnpm --filter @choragen/core typecheck
```

## Package Structure

| Package | Description |
|---------|-------------|
| `@choragen/core` | Task chains, governance, locks |
| `@choragen/cli` | Command-line interface |
| `@choragen/contracts` | DesignContract, ApiError, HttpStatus |
| `@choragen/eslint-plugin` | ESLint rules (future) |
| `@choragen/test-utils` | Testing utilities |

## CLI Commands

```bash
# Chain management
choragen chain:new <cr-id> <slug> [title]
choragen chain:status [chain-id]
choragen chain:list

# Task management
choragen task:add <chain-id> <slug> <title>
choragen task:ready <chain-id> <task-id>
choragen task:start <chain-id> <task-id>
choragen task:complete <chain-id> <task-id>
choragen task:approve <chain-id> <task-id>
choragen task:rework <chain-id> <task-id>
choragen task:block <chain-id> <task-id>
choragen task:next <chain-id>
choragen task:list <chain-id>

# Governance
choragen governance:check <action> <file1> [file2...]

# Locks
choragen lock:acquire <chain-id> <pattern1> [pattern2...]
choragen lock:release <chain-id>
choragen lock:status
```

## Self-Hosting

Choragen uses its own patterns for development:
- CRs/FRs in `docs/requests/`
- ADRs in `docs/adr/`
- Design docs in `docs/design/`
- Task chains in `docs/tasks/` (when working on features)

## Agent Roles

### Control Agent
The control agent manages work but **does not implement**:
- Creates CRs/FRs for new work
- Creates task chains and populates task files
- Reviews completed work from impl agents
- Approves or sends back for rework
- Commits and pushes completed work

### Commit Policy

Control agents commit after each chain completion:

1. After moving all tasks to `done/`
2. Before starting the next chain
3. Use this commit message format:

```
<type>(<scope>): complete <CHAIN-ID>

- Task 1 summary
- Task 2 summary
- ...

<CR-xxx | FR-xxx>
```

Types: `feat` (new feature), `fix` (bug fix), `docs` (documentation), `chore` (maintenance)

### Implementation Agent
The impl agent executes tasks:
- Reads task file for full context
- Implements according to acceptance criteria
- Runs verification commands
- Reports completion (does NOT move task files)

### Control-Only Tasks

Some tasks are control agent responsibilities with no impl handoff:
- Verification tasks (e.g., "verify and close CR")
- Review tasks
- CR/FR closure tasks

For these tasks:
1. Control agent executes the task directly
2. Control agent updates task status to `done`
3. Control agent moves task file to `done/<CHAIN-ID>/`

Mark control-only tasks with `**Type**: control` in the task header.

## CRITICAL: Never Skip the System

**Control agents must NEVER implement code directly.** Even for "quick fixes":

1. Create an FR (fix request) or CR (change request)
2. Create a task chain with task(s)
3. Hand off to impl agent with prompt
4. Review and approve

This ensures:
- Full traceability (every change has a request)
- Proper review (control agent verifies work)
- Reproducibility (task files capture context)
- Accountability (clear ownership)

### Handoff Prompt Template

```
You are an implementation agent working on the choragen project at /Users/justin/Projects/choragen

Your task is defined in this file:
docs/tasks/todo/<CHAIN-ID>/<TASK-FILE>.md

Read that file for your full instructions. Complete the task according to the acceptance criteria.

When done:
1. Run verification commands in the task
2. Report back what you completed
3. Do NOT move the task file - the control agent will review and approve

Start by reading the task file.
```

---

## Validation Commands

Run these before committing to ensure all traceability and quality checks pass.

### Quick Validation

```bash
# Build and type check
pnpm build
pnpm --filter @choragen/core typecheck

# Run tests
pnpm --filter @choragen/core test

# Lint check
pnpm lint
```

### Full Validation Suite

```bash
# All validation scripts (run from project root)
node scripts/validate-links.mjs
node scripts/validate-adr-traceability.mjs
node scripts/validate-chain-types.mjs
node scripts/validate-commit-traceability.mjs
node scripts/validate-complete-traceability.mjs
node scripts/validate-contract-coverage.mjs
node scripts/validate-design-doc-content.mjs
node scripts/validate-request-completion.mjs
node scripts/validate-request-staleness.mjs
node scripts/validate-source-adr-references.mjs
node scripts/validate-test-coverage.mjs
node scripts/validate-adr-staleness.mjs
node scripts/validate-agents-md.mjs
```

### Specific Validators

| Script | Purpose |
|--------|---------|
| `validate-links.mjs` | Check all internal documentation links |
| `validate-adr-traceability.mjs` | Verify ADRs link to CR/FR and design docs |
| `validate-chain-types.mjs` | Ensure task chain types are valid |
| `validate-commit-traceability.mjs` | Validate commits reference CR/FR |
| `validate-complete-traceability.mjs` | Full Request → Design → ADR → Code chain |
| `validate-contract-coverage.mjs` | DesignContract coverage across API routes |
| `validate-design-doc-content.mjs` | Design docs have required sections |
| `validate-request-completion.mjs` | Request docs have completion notes |
| `validate-request-staleness.mjs` | Flag stale requests |
| `validate-source-adr-references.mjs` | Source files reference governing ADRs |
| `validate-test-coverage.mjs` | Design ↔ test links and coverage |
| `validate-adr-staleness.mjs` | Flag stale ADRs in doing/ |
| `validate-agents-md.mjs` | Verify AGENTS.md files exist in packages |

### Structured Output for Agents

All validation scripts output JSON for agent consumption:

```bash
# Pipe to jq for formatted output
node scripts/validate-links.mjs 2>/dev/null | jq

# Check exit code for pass/fail
node scripts/validate-adr-traceability.mjs && echo "PASS" || echo "FAIL"
```

---

## Test Traceability

### Adding Test Metadata

Every test file should include metadata linking it to design documentation:

```typescript
/**
 * @design-doc docs/design/core/features/task-management.md
 * @test-type unit | integration | e2e
 */
describe("TaskManager", () => {
  it("should create a new task", () => {
    // test implementation
  });
});
```

### Test Type Mapping

| Design Doc Type | Test Type | Purpose |
|-----------------|-----------|---------|
| Scenarios | E2E tests | User journeys |
| Use-Cases | Integration tests | Specific actions |
| Features | Unit tests | Capabilities |
| Enhancements | Unit/Integration | Improvements |

### Validating Coverage

```bash
# Check test coverage against design docs
node scripts/validate-test-coverage.mjs

# Output shows:
# - Design docs without tests
# - Tests without design doc links
# - Coverage percentage by domain
```

---

## Lint After Every Edit (CRITICAL)

**Run ESLint after EVERY file edit to catch errors immediately.** This prevents compounding errors across multiple edits.

```bash
# After editing any .ts file, run:
pnpm lint

# Or for a specific file:
npx eslint packages/core/src/file.ts

# For test files (catches @design-doc requirements):
npx eslint packages/core/src/__tests__/file.test.ts
```

### Why This Matters

The IDE does not surface ESLint errors to agents. Running lint after each edit catches:

- Missing `@design-doc` tags in tests
- Missing ADR references in source files
- Missing `DesignContract` wrappers on API routes
- Magic number violations
- Import order issues

### Quick Checks

```bash
# Full lint on specific files
npx eslint packages/core/src/file.ts packages/cli/src/other.ts

# Type check specific package
pnpm --filter @choragen/core typecheck
```

---

## Agentic Development

This project is built using **agent-first development**. All development follows structured patterns that enable autonomous agent workflows.

### Key Principles

1. **All changes go through CR/FR → Chain → Task flow**
   - No direct code changes without a request
   - Every commit references a CR or FR

2. **Control agents manage, impl agents execute**
   - Control: Creates requests, chains, reviews work
   - Impl: Reads task files, implements, reports completion

3. **Validation scripts provide structured output**
   - JSON output for machine parsing
   - Exit codes for pass/fail detection
   - Actionable error messages

4. **Design-to-implementation traceability**
   - Every artifact links backward
   - Code → Tests → ADR → Design → Request

### Structured Output

All validation scripts output JSON for agent consumption:

```bash
# Get structured validation results
node scripts/validate-links.mjs 2>/dev/null | jq

# Example output structure
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "summary": {
    "checked": 42,
    "passed": 42,
    "failed": 0
  }
}
```

### Agent-Friendly Patterns

- **Exit codes**: 0 = success, 1 = failure
- **JSON output**: Structured data for parsing
- **Actionable messages**: Specific commands to fix issues
- **Idempotent operations**: Safe to re-run

### Verification Before Completion

**A task is NOT complete until verification passes.** Include verification status in task completion:

```
✅ Verification passed:
- build: success
- typecheck: 0 errors
- test: all passing
- lint: 0 errors
```

---

## Subdirectory Guides

Additional, domain-specific instructions exist in package directories:

- `packages/core/AGENTS.md` - Core library patterns
- `packages/cli/AGENTS.md` - CLI development
- `packages/contracts/AGENTS.md` - Contract definitions
- `packages/eslint-plugin/AGENTS.md` - ESLint rules
- `docs/AGENTS.md` - Documentation structure
- `scripts/AGENTS.md` - Validation scripts
- `templates/AGENTS.md` - Document templates
- `githooks/AGENTS.md` - Git hook configuration

Always check for an `AGENTS.md` file in the directory you're working in for domain-specific guidance.
