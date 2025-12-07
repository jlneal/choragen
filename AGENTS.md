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
choragen task:start <chain-id> <task-id>
choragen task:complete <chain-id> <task-id>
choragen task:next <chain-id>

# Governance & Locks
choragen governance:check <action> <file1> [file2...]
choragen lock:acquire <chain-id> <pattern1> [pattern2...]
choragen lock:release <chain-id>
```

## Agent Roles

This project uses a two-agent model. See the detailed guides:

- **[Control Agent](docs/agents/control-agent.md)** - Manages work, creates requests/chains, reviews
- **[Implementation Agent](docs/agents/impl-agent.md)** - Executes tasks, implements code
- **[Handoff Templates](docs/agents/handoff-templates.md)** - Prompts for agent handoffs

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
