# Task: Create CI Workflow

**Chain**: CHAIN-027-ci-pipeline  
**Task**: 002-create-workflow  
**Type**: implementation  
**Status**: todo  

---

## Objective

Create `.github/workflows/ci.yml` implementing the CI pipeline.

---

## Workflow Structure

```yaml
# ADR: ADR-007-ci-pipeline
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test
      - run: pnpm lint
      - run: pnpm validate:all
```

---

## Key Requirements

1. **ADR reference**: First line must be `# ADR: ADR-007-ci-pipeline`
2. **pnpm caching**: Use pnpm/action-setup with cache
3. **Frozen lockfile**: Ensure reproducible installs
4. **All validators**: Run pnpm validate:all (includes user-value-traceability)

---

## Acceptance Criteria

- [ ] `.github/workflows/ci.yml` exists
- [ ] Has ADR reference comment
- [ ] Triggers on push and PR to main
- [ ] Runs build, test, lint, validate:all
- [ ] Uses pnpm with caching
- [ ] Uses Node.js 22
- [ ] Passes validate-source-adr-references.mjs

---

## Files to Create

- `.github/workflows/ci.yml`

---

## Verification

```bash
node scripts/validate-source-adr-references.mjs
```
