# Feature: Validation Pipeline

**Domain**: core  
**Created**: 2025-12-07  
**Status**: Implemented  

---

## Overview

The validation pipeline enforces traceability and quality through three layers: ESLint rules (development time), Git hooks (commit time), and validation scripts (CI/manual). This defense-in-depth approach catches issues at multiple stages.

---

## Three Enforcement Layers

### Layer 1: ESLint Rules

**When**: Development time (IDE integration)

ESLint rules provide immediate feedback as developers write code:

- Traceability violations (missing ADR references, design doc links)
- Contract violations (missing DesignContract wrapper)
- Code hygiene issues (magic numbers, unsafe casts)
- Test quality issues (trivial assertions, missing metadata)

See [eslint-plugin.md](./eslint-plugin.md) for rule details.

### Layer 2: Git Hooks

**When**: Commit time (pre-commit, commit-msg, pre-push)

Git hooks prevent non-compliant commits:

| Hook | Purpose |
|------|---------|
| `pre-commit` | Run quick validators before commit |
| `commit-msg` | Validate commit message format |
| `pre-push` | Run CI validators before push |

Install hooks:
```bash
choragen hooks:install
```

### Layer 3: Validation Scripts

**When**: CI pipeline and manual verification

Standalone scripts for comprehensive validation:

```bash
# Run all validators
node scripts/run-validators.mjs

# Run specific validator
node scripts/validate-links.mjs
```

---

## Validation Scripts

### run-validators.mjs (Orchestrator)

Runs all validators in sequence and reports results:

```bash
node scripts/run-validators.mjs
```

Features:
- Discovers all `validate-*.mjs` scripts automatically
- Runs validators sequentially
- Reports pass/fail summary
- Exits with code 1 if any validator fails

### validate-links.mjs

Validates bidirectional links between documentation and implementation:

- Design docs link to implementation files
- Implementation files link back to design docs
- ADRs link to CR/FR and design docs

### validate-adr-traceability.mjs

Validates ADR traceability requirements:

- ADRs in `done/` must have implementation references
- ADRs must link to CR/FR
- ADRs must link to design docs

### validate-adr-staleness.mjs

Detects stale ADRs:

- ADRs in `doing/` for more than 7 days
- ADRs in `todo/` for more than 14 days

### validate-source-adr-references.mjs

Validates source file ADR references:

- Source files should reference governing ADR
- Referenced ADRs must exist

### validate-design-doc-content.mjs

Validates design document completeness:

- Required sections present (Overview, Acceptance Criteria, Implementation)
- Implementation section has file references
- Acceptance criteria use checkbox format

### validate-request-staleness.mjs

Detects stale requests:

- CRs/FRs in `doing/` for more than 3 days
- CRs/FRs in `todo/` for more than 7 days

### validate-request-completion.mjs

Validates request completion:

- Closed CRs/FRs have completion notes
- Associated chains are complete

### validate-commit-traceability.mjs

Validates commit message traceability:

- Commits reference CR/FR
- Commit format follows convention

### validate-complete-traceability.mjs

Comprehensive traceability validation:

- Full chain: CR/FR → Design → ADR → Implementation → Tests
- Identifies gaps in traceability

### validate-contract-coverage.mjs

Validates DesignContract coverage:

- API routes use DesignContract wrapper
- Contract design docs exist

### validate-test-coverage.mjs

Validates test coverage:

- Implementation files have corresponding tests
- Tests reference design docs

### validate-chain-types.mjs

Validates chain type constraints:

- Implementation chains have design dependency or skip justification
- Design chains don't have implementation dependencies

### validate-agents-md.mjs

Validates AGENTS.md presence:

- Each package directory has AGENTS.md
- Key directories have AGENTS.md

---

## Validator Presets

The CLI provides preset groups:

### Quick Validators

Fast checks for pre-commit:

```bash
choragen validate --quick
```

Includes:
- `validate-links.mjs`
- `validate-agents-md.mjs`

### CI Validators

Comprehensive checks for CI pipeline:

```bash
choragen validate --ci
```

Includes:
- `validate-links.mjs`
- `validate-adr-traceability.mjs`
- `validate-agents-md.mjs`
- `validate-chain-types.mjs`
- `validate-request-completion.mjs`

### All Validators

Run everything:

```bash
choragen validate --all
```

---

## Output Format

Validators use consistent output format:

```
✅ Check passed
⚠️  Warning (non-blocking)
❌ Error (blocking)
```

ANSI colors for terminal:
- Green: Success
- Yellow: Warning
- Red: Error

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All checks passed |
| 1 | One or more checks failed |

---

## Linked Scenarios

- [Control Agent Workflow](../scenarios/control-agent-workflow.md)
- [Implementation Agent Workflow](../scenarios/implementation-agent-workflow.md)

---

## Acceptance Criteria

- [ ] ESLint rules provide development-time feedback
- [ ] Git hooks prevent non-compliant commits
- [ ] Validation scripts run in CI pipeline
- [ ] run-validators.mjs orchestrates all validators
- [ ] Each validator has clear purpose and output
- [ ] Presets group validators for common use cases

---

## Implementation

- `scripts/run-validators.mjs`
- `scripts/validate-*.mjs`
- `githooks/pre-commit`
- `githooks/commit-msg`
- `githooks/pre-push`
