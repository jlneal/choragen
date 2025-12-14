# Task: Update Design Documents

**Chain**: CHAIN-074-commit-audit  
**Task**: 005  
**Status**: todo  
**Type**: control  
**Created**: 2025-12-13

---

## Objective

Update the affected design documents to reflect the new audit feedback type and post-commit gate concept.

---

## Context

Three design documents need updates:
1. **Agent Feedback** — Add `audit` to feedback types table
2. **Standard Workflow** — Add post-commit gate concept to Stage 6
3. **Governance Enforcement** — Reference audit as a governance mechanism

Reference: `@/Users/justin/Projects/choragen/docs/requests/change-requests/doing/CR-20251213-003-commit-audit.md:54-57`

---

## Expected Files

- `docs/design/core/features/agent-feedback.md`
- `docs/design/core/features/standard-workflow.md`
- `docs/design/core/features/governance-enforcement.md`

---

## Acceptance Criteria

- [ ] Agent Feedback: `audit` type added to Feedback Types table (line ~39-46)
- [ ] Agent Feedback: `FeedbackType` union updated to include `"audit"`
- [ ] Agent Feedback: Linked ADRs section references ADR-015
- [ ] Standard Workflow: Post-commit gate added to Stage 6 (Commit)
- [ ] Standard Workflow: Note that post-commit gate is async/non-blocking
- [ ] Governance Enforcement: Audit mentioned as governance mechanism
- [ ] All changes maintain existing document structure

---

## Constraints

- Preserve existing content — only add new sections/rows
- Follow existing formatting conventions in each document

---

## Notes

This is a control task because it involves documentation updates that don't require implementation agent handoff.
