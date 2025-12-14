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
├── requests/           # Change and fix requests (todo/doing/done)
├── adr/                # Architecture Decision Records (todo/doing/done/archive)
├── design/             # Design documentation (scenarios/features/enhancements)
└── architecture.md     # System overview
```

## Traceability Chain

Every artifact links backward to user value:

```
Persona → Scenario → Use Case → Feature → CR/FR → ADR → Implementation → Commits
```

The chain is **bi-directional** at CR/FR ↔ Commits:
- Commits reference CR/FR IDs in messages
- CR/FR docs list commits in `## Commits` section (via `choragen request:close`)

## Commit Message Format

```
<type>(<scope>): <description>

[body]

[CR-xxx | FR-xxx]
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

## Package Structure

| Package | Description |
|---------|-------------|
| `@choragen/core` | Task chains, governance, locks |
| `@choragen/cli` | Command-line interface |
| `@choragen/contracts` | DesignContract, ApiError, HttpStatus |
| `@choragen/eslint-plugin` | ESLint rules (future) |
| `@choragen/test-utils` | Testing utilities |

## Agent Roles

This project uses a two-agent model. See the detailed guides:

- **[Control Agent](docs/agents/control-agent.md)** - Manages work, creates requests/chains, reviews
- **[Implementation Agent](docs/agents/impl-agent.md)** - Executes tasks, implements code
- **[Handoff Templates](docs/agents/handoff-templates.md)** - Prompts for agent handoffs

---

## Session Role Declaration

**Every agent session MUST declare its role at the start of work.**

When you begin a task, identify which role you are operating as:

```
ROLE: impl | control
```

Your role determines what actions you are permitted to take. If a task file specifies `Type: impl` or `Type: control`, that is your role for the session. If no type is specified, default to `impl` for code changes and `control` for documentation/planning work.

**Role violations are serious.** If you find yourself needing to perform an action outside your role boundaries, STOP and request a handoff to the appropriate agent role.

---

## Role Boundaries

These boundaries define what each role can and cannot do. File patterns use glob syntax for future programmatic extraction.

### If ROLE = impl

**ALLOWED:**
- `packages/**/src/**/*.ts` — create, modify
- `packages/**/__tests__/**/*.ts` — create, modify, delete
- `packages/**/src/**/*.json` — create, modify
- `*.config.*` — modify (with caution)
- `README.md` — modify (package-level only)

**DENIED:**
- `docs/tasks/**` — move, delete (control agent manages task lifecycle)
- `docs/requests/**` — create, modify, move (control agent creates CRs/FRs)
- `docs/adr/**` — create, move (control agent manages ADRs)
- `git commit` — impl agents do not commit directly
- `git push` — impl agents do not push directly
- `choragen request:close` — control agent closes requests
- `choragen chain:new` — control agent creates chains

### If ROLE = control

**ALLOWED:**
- `docs/**/*.md` — create, modify, move, delete
- `docs/tasks/**` — create, move (manage task lifecycle)
- `docs/requests/**` — create, modify, move
- `docs/adr/**` — create, modify, move
- `AGENTS.md` — modify (root and subdirectory)
- `git commit` — with proper CR/FR reference
- `git push` — after verification passes
- `choragen *` — all CLI commands

**DENIED:**
- `packages/**/src/**/*.ts` — create, modify (impl agent writes code)
- `packages/**/__tests__/**/*.ts` — create, modify (impl agent writes tests)
- Creating test files of any kind

### Boundary Enforcement

These boundaries are currently enforced by convention. Future versions will include:
- CLI validation via `choragen governance:check`
- Pre-commit hooks that verify role compliance
- Automated boundary extraction from this document

---

## Chain Policy

Task chains provide traceability, context preservation, and progress tracking. This policy defines when chains are required.

### Chains are REQUIRED when

- Work spans multiple sessions or context windows
- Work involves multiple agents (control + impl handoffs)
- Work affects core packages (`@choragen/core`, `@choragen/cli`, `@choragen/contracts`)
- CR/FR has 3 or more acceptance criteria
- Work involves more than 2 files

### Chains are OPTIONAL when

- Single-session documentation-only updates (e.g., fixing typos, updating README)
- Simple config changes (single file, no logic)
- FR severity is "low" AND scope is trivial (1 file, <20 lines)

### When skipping a chain

If you determine a chain is not needed, you MUST:

1. Add to the request file: `**Chain**: Skipped — [reason]`
2. Ensure commit message still references the request ID
3. Complete the work in a single session

Example:
```markdown
**Chain**: Skipped — single-file typo fix, <10 lines changed
```

### Default to creating a chain

When in doubt, create a chain. The overhead is minimal and the traceability benefits are significant.

---

## Commit Discipline

Commits must maintain traceability. Follow these rules strictly.

### Before starting a new request

1. **Commit all changes** from the current request
2. **Commit message must reference** the request ID (e.g., `[CR-20251207-001]`)
3. **Run `choragen request:close`** if the request is complete
4. **Only then** move to the next request

### Commit message format

```
<type>(<scope>): <description>

[body]

[CR-xxx | FR-xxx]
```

The request ID in brackets is **required** for all commits related to a request.

### Never

- Start a new request with uncommitted changes from a previous request
- Combine changes from multiple requests in a single commit
- Commit without a request ID reference (unless it's truly unrelated infrastructure)

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
