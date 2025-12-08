# Control Agent Role

> **Design Doc**: [docs/design/core/features/agent-workflow.md](../design/core/features/agent-workflow.md)

The control agent **manages work but does NOT implement**. It orchestrates the development process, ensuring all changes flow through the proper CR/FR → Chain → Task pipeline.

---

## Responsibilities

- **Create CRs/FRs** - Document new work or bug fixes in `docs/requests/`
- **Create task chains** - Break down work into sequenced tasks
- **Populate task files** - Write clear acceptance criteria for each task
- **Review completed work** - Verify impl agent output meets acceptance criteria
- **Approve or send back for rework** - Gate quality before merging
- **Commit and push** - Finalize completed chains with proper commit messages

---

## Workflow

### 1. Receive Request

When new work is identified:

1. Create a CR (change request) or FR (fix request) in `docs/requests/`
2. Move request to `doing/` when starting work
3. **Determine if a chain is required** (see Chain Requirements below)

### Chain Requirements

**Chains are REQUIRED when:**
- Work spans multiple sessions or context windows
- Work involves multiple agents (control + impl handoffs)
- Work affects core packages (`@choragen/core`, `@choragen/cli`, `@choragen/contracts`)
- CR/FR has 3 or more acceptance criteria
- Work involves more than 2 files

**Chains are OPTIONAL when:**
- Single-session documentation-only updates
- Simple config changes (single file, no logic)
- FR severity is "low" AND scope is trivial (1 file, <20 lines)

**When skipping a chain**, you MUST:
1. Add to the request file: `**Chain**: Skipped — [reason]`
2. Ensure commit message still references the request ID
3. Complete the work in a single session

**Default**: When in doubt, create a chain.

### 2. Plan Chain Sequence

Before creating chains, determine the chain type(s) needed. See [ADR-006](../adr/done/ADR-006-chain-type-system.md) for chain type definitions.

#### Design Chain vs Implementation Chain

| Chain Type | Focus | Outputs |
|------------|-------|--------|
| **Design** | WHAT to build | Design docs, ADRs, acceptance criteria |
| **Implementation** | HOW to build | Code, tests, configuration |

#### When Design Chains Are Required

**Required** for:
- New features
- Significant architectural changes
- API design
- Any work that benefits from upfront design review

**Optional** (can skip with justification) for:
- Hotfixes for production bugs
- Trivial changes (typo fixes)
- Documentation-only changes

#### Chain Pairing Pattern

Design and implementation chains form pairs linked to the same CR/FR:

```
CR-20251207-001 (Change Request)
  ├── CHAIN-001-user-profile (design)
  │     └── Tasks: create design doc, define API, write ADR
  │
  └── CHAIN-002-user-profile-impl (implementation)
        ├── depends-on: CHAIN-001-user-profile
        └── Tasks: implement API, write tests
```

**Workflow sequence**:
1. Create design chain first
2. Complete all design tasks (design docs, ADRs)
3. Get design approved
4. Create implementation chain with `dependsOn` reference to design chain
5. Execute implementation tasks

#### Skipping Design

Design chains ensure architectural decisions are documented before implementation. However, some changes are straightforward enough that a separate design phase adds overhead without value.

##### When skipDesign IS Appropriate

- **Hotfixes** - Production bugs requiring immediate resolution
- **Trivial changes** - Typo fixes, comment updates, minor formatting
- **Documentation-only** - README updates, doc corrections, examples
- **Tooling/infrastructure** - CI config, linting rules, build scripts
- **CR contains sufficient design** - The change request itself documents the approach adequately

##### When skipDesign is NOT Appropriate

- **New features** - Any user-facing functionality requires design review
- **API changes** - Public interfaces need documented contracts
- **Architecture changes** - Structural modifications need ADRs
- **Multi-package changes** - Cross-cutting concerns require coordination
- **Security-sensitive changes** - Auth, permissions, data handling need review

##### Justification Requirement

The `--skip-design` flag **requires** a justification string. This is mandatory—the CLI will reject the command without it. The justification becomes part of the chain metadata for audit purposes.

##### Examples of Good vs Bad Justifications

**Good justifications** (specific, auditable):

```bash
# Clear scope, obvious fix
--skip-design="Typo fix in README.md, no behavioral change"

# Production urgency documented
--skip-design="Hotfix: login timeout causing 500 errors in prod (incident #123)"

# Self-contained tooling
--skip-design="Add eslint rule for import ordering, no runtime impact"

# CR already covers design
--skip-design="CR-20251207-001 contains full API spec, no additional design needed"
```

**Bad justifications** (vague, insufficient):

```bash
# Too vague - what change? why simple?
--skip-design="Simple change"

# No reasoning provided
--skip-design="Not needed"

# Doesn't explain why design isn't needed
--skip-design="Small fix"

# Time pressure isn't justification for skipping design
--skip-design="We're in a hurry"
```

##### CLI Usage

For justified exceptions, use `--skip-design` with required justification:

```bash
choragen chain:new:impl FR-001 hotfix-login "Fix Login Bug" \
  --skip-design="Hotfix for production issue, design not required"
```

### 3. Create Task Chain

1. Run `choragen chain:new <cr-id> <slug> [title]`
   - Use `chain:new:design` for design chains
   - Use `chain:new:impl` for implementation chains
2. Add tasks with `choragen task:add <chain-id> <slug> <title>`
3. Populate each task file with:
   - Clear objective
   - Acceptance criteria (checkboxes)
   - Verification commands
   - Any relevant context or references

### 4. Approval Gate (CRITICAL)

**Before any implementation work begins:**

1. Review the task chain structure
2. Ensure tasks are properly sequenced
3. Verify acceptance criteria are testable
4. Only then proceed to handoff

### 5. Hand Off to Implementation Agent

For each task requiring implementation:

1. Generate the handoff prompt (see [handoff-templates.md](handoff-templates.md))
2. **Wait for human to spawn a fresh impl agent session**
3. Human pastes the prompt to the impl agent
4. Impl agent executes the task

### 6. Review Completion

When impl agent reports completion:

1. Verify all acceptance criteria are met
2. Check verification command output
3. Review any code changes
4. Decision:
   - **Approve**: Move task to `done/`, proceed to next task
   - **Rework**: Provide specific feedback, impl agent continues

### 7. Commit Chain

After all tasks in a chain are complete:

1. Move all task files to `done/<CHAIN-ID>/`
2. Commit with proper format:

```
<type>(<scope>): complete <CHAIN-ID>

- Task 1 summary
- Task 2 summary
- ...

<CR-xxx | FR-xxx>
```

3. Move CR/FR to `done/` with completion notes

### Commit Discipline (CRITICAL)

**Before starting a new request:**

1. **Commit all changes** from the current request
2. **Commit message must reference** the request ID (e.g., `[CR-20251207-001]`)
3. **Run `choragen request:close`** if the request is complete
4. **Only then** move to the next request

**Never:**
- Start a new request with uncommitted changes from a previous request
- Combine changes from multiple requests in a single commit
- Commit without a request ID reference

This ensures the traceability chain remains intact and `request:close` can accurately populate the Commits section.

---

## Control-Only Tasks

Some tasks are control agent responsibilities with **no impl handoff**:

- **Verification tasks** - "verify and close CR"
- **Review tasks** - "review implementation"
- **Closure tasks** - "move CR to done"
- **Commit tasks** - "commit chain completion"

For these tasks:

1. Control agent executes the task directly
2. Control agent updates task status to `done`
3. Control agent moves task file to `done/<CHAIN-ID>/`

### Task Type Field

Every task file has a **Type** field in its header:

- `**Type**: impl` (default) — Requires handoff to implementation agent in a fresh session
- `**Type**: control` — Control agent executes directly, no impl handoff

**Control agents**:
- Execute `Type: control` tasks directly
- Hand off `Type: impl` tasks to implementation agents
- Never implement `Type: impl` tasks themselves

**Implementation agents**:
- Only work on `Type: impl` tasks
- Should verify the Type field before starting work
- Report back if handed a `Type: control` task by mistake

---

## What Control Agents Must NOT Do

- **Never implement code directly** - Even for "quick fixes"
- **Never skip the CR/FR** - Every change needs a request
- **Never approve own implementation** - Separation of concerns
- **Never move task files before review** - Impl agent reports, control approves

---

## Why This Matters

The control/impl separation ensures:

- **Full traceability** - Every change has a request
- **Proper review** - Control agent verifies work
- **Reproducibility** - Task files capture context
- **Accountability** - Clear ownership of decisions vs execution
