# Fix Request: Incomplete Design Doc Sections

**ID**: FR-20251207-009  
**Domain**: docs  
**Status**: done  
**Created**: 2025-12-07  
**Completed**: 2025-12-07
**Severity**: medium  
**Owner**: agent  
**Chain**: Skipped — single-session doc fix, 8 files

---

## Problem

8 design docs are missing required sections, causing the pre-commit hook `validate-design-doc-content.mjs` to fail.

---

## Expected Behavior

All design docs should have required sections:
- Enhancements: "Current State" or equivalent (Problem, Background, Context, Overview)
- Use Cases: "User Goal" and "Acceptance Criteria" or equivalents

---

## Actual Behavior

Pre-commit hook fails with:
```
❌ Design doc content validation failed (18/26 valid)
```

---

## Steps to Reproduce

1. Stage any file for commit
2. Run `git commit`
3. Pre-commit hook runs `validate-design-doc-content.mjs`
4. Fails on 8 incomplete docs

---

## Root Cause Analysis

These docs were created as placeholders during initial bootstrap and never completed with required sections.

---

## Proposed Fix

Add minimal required sections to each incomplete doc:
- Enhancements: Add "## Overview" section
- Use Cases: Add "## User Goal" and "## Acceptance Criteria" sections

---

## Affected Files

- `docs/design/core/enhancements/dashboard-ui.md` — missing Current State
- `docs/design/core/enhancements/metrics-analytics.md` — missing Current State
- `docs/design/core/enhancements/multi-repo-coordination.md` — missing Current State
- `docs/design/core/enhancements/vscode-extension.md` — missing Current State
- `docs/design/core/use-cases/bootstrap-new-project.md` — missing User Goal, Acceptance Criteria
- `docs/design/core/use-cases/create-execute-task-chain.md` — missing User Goal, Acceptance Criteria
- `docs/design/core/use-cases/debug-failed-task.md` — missing User Goal, Acceptance Criteria
- `docs/design/core/use-cases/review-approve-work.md` — missing User Goal, Acceptance Criteria

---

## Linked ADRs

- ADR-001-task-file-format (documentation structure)

---

## Commits

- addf885 fix(docs): add missing sections to design docs

## Verification

- [x] `node scripts/validate-design-doc-content.mjs` passes
- [x] Pre-commit hook passes
- [x] All 8 docs have required sections

---

## Completion Notes

**Completed**: 2025-12-07

Fixed 8 design docs by adding required sections:
- Enhancements (4): Renamed "Description" to "Overview" (accepted alternative for "Current State")
- Use Cases (4): Added "User Goal" and "Acceptance Criteria" sections

Validator now reports: `✅ Design doc content validation passed (26/26 files)`
