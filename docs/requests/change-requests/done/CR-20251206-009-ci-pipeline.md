# Change Request: CI/CD Pipeline

**ID**: CR-20251206-009  
**Domain**: tooling  
**Status**: done  
**Created**: 2025-12-06  
**Owner**: agent  

---

## What

Add GitHub Actions CI/CD pipeline for automated build, test, lint, and validation on pull requests and pushes.

---

## Why

1. **Automated quality gates** — Catch issues before merge
2. **Consistent verification** — Same checks run for all contributors
3. **Documentation** — Pipeline config documents the verification process
4. **Trust** — External contributors can see tests pass

---

## Scope

**In Scope**:
- GitHub Actions workflow for PRs
- Build all packages
- Run all tests
- Run linter
- Run validation scripts (at least CI subset)
- Node.js version matrix (22.x)
- Cache pnpm dependencies

**Out of Scope**:
- Automated npm publishing (future CR)
- Deployment workflows
- Release automation
- Code coverage reporting (future enhancement)

---

## Affected Design Documents

- [docs/design/core/features/validation-pipeline.md](../../../design/core/features/validation-pipeline.md)

---

## Linked ADRs

- ADR-007-ci-pipeline

---

## Commits

No commits yet.

---

## Implementation Notes

Workflow structure:
```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    - pnpm install
    - pnpm build
    - pnpm test
    - pnpm lint
    - pnpm validate:all (or CI subset)
```

Consider:
- Matrix testing if supporting multiple Node versions
- Caching strategy for pnpm
- Fail-fast vs complete-all strategy
- Status checks required for merge

---

## Completion Notes

**Completed**: 2025-12-07

### Implementation Summary

Implemented GitHub Actions CI pipeline via CHAIN-027-ci-pipeline.

**Created**:
- `docs/adr/done/ADR-007-ci-pipeline.md` — Documents CI decisions
- `.github/workflows/ci.yml` — CI workflow with ADR reference

**Workflow Steps**:
1. Checkout code
2. Setup pnpm with caching
3. Setup Node.js 22
4. Install dependencies (frozen lockfile)
5. Build all packages
6. Run tests
7. Run linter
8. Run all validators (including user-value-traceability)

**Triggers**: Push and PR to main branch

### Traceability

```
.github/workflows/ci.yml
    ↑ ADR: ADR-007-ci-pipeline
        ↑ CR: CR-20251206-009
            ↑ Feature: validation-pipeline.md
                ↑ Scenarios: control-agent-workflow, implementation-agent-workflow
                    ↑ Personas: Control Agent, Implementation Agent
```
