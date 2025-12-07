# ADR-007: CI Pipeline

**Status**: done  
**Created**: 2025-12-07  
**Linked CR/FR**: CR-20251206-009  
**Linked Design Docs**: docs/design/core/features/validation-pipeline.md

---

## Context

The Choragen project requires automated quality gates to:
1. Catch issues before merge
2. Ensure consistent verification across all contributors
3. Provide fast feedback on failures
4. Build trust with external contributors through visible test results

Manual verification is error-prone and doesn't scale with contributors.

---

## Decision

### Platform: GitHub Actions

Use GitHub Actions as the CI/CD platform.

**Rationale**:
- Native integration with GitHub repository
- Free for open source projects
- No external service dependencies
- Familiar to most contributors

### Triggers

Run CI on:
- `push` to `main` branch
- `pull_request` targeting `main` branch

### Node Version: 22.x

Use Node.js 22.x to match the project's `.nvmrc` and `engines` field in `package.json`.

### Package Manager: pnpm with Caching

Use pnpm with GitHub Actions caching:
- `pnpm/action-setup@v2` for pnpm installation
- `actions/setup-node@v4` with `cache: 'pnpm'` for dependency caching
- `--frozen-lockfile` for reproducible installs

### Jobs: Single Sequential Job

Use a single job with sequential steps:

```
build → test → lint → validate
```

**Rationale**:
- Simpler configuration and debugging
- No artifact passing between jobs
- Faster for small-to-medium projects (no job startup overhead)
- Clear failure point identification

### Fail Strategy: Fail-Fast

Stop execution on first failure.

**Rationale**:
- Faster feedback on failures
- Conserves CI minutes
- Clear signal of what needs fixing

---

## Consequences

**Positive**:
- All checks run automatically on every PR
- Fast feedback on failures
- Consistent environment for all contributors
- No manual verification steps required
- Pipeline configuration documents the verification process

**Negative**:
- Single job means no parallelization of independent steps
- All steps must pass before any feedback (no partial results)

**Mitigations**:
- Sequential steps are fast enough for current project size
- Can split into parallel jobs if build times grow significantly

---

## Alternatives Considered

### Alternative 1: Multiple Parallel Jobs

Run build, test, lint, and validate as separate parallel jobs.

**Rejected because**: 
- Adds complexity with artifact passing
- Job startup overhead exceeds time saved for current project size
- Harder to debug failures across jobs

### Alternative 2: CircleCI or Other CI Platform

Use an external CI platform.

**Rejected because**:
- Adds external service dependency
- GitHub Actions is sufficient and native to the repository
- Free tier is adequate for project needs

### Alternative 3: Matrix Testing (Multiple Node Versions)

Test against multiple Node.js versions.

**Rejected because**:
- Project explicitly requires Node 22+ (`engines` field)
- No need to support older versions
- Can add matrix testing if requirements change

---

## Implementation

- `.github/workflows/ci.yml`
