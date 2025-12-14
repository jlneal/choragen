# Task: Chain Completion Validation Types

**Chain**: CHAIN-076-chain-completion-gate  
**Task**: 001-validation-types  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Define TypeScript types for chain completion validation. This includes validation check types, validation results, and configuration options.

---

## Context

The chain completion gate needs a type system to describe:
- What checks can be performed (task_state, completion_notes, acceptance_criteria, design_doc_updates, test_coverage)
- Results of validation (pass/fail with actionable feedback)
- Configuration (per-chain or global defaults)

This task creates the foundation types that subsequent tasks will implement.

---

## Expected Files

- `packages/core/src/chain/validation-types.ts`

---

## Acceptance Criteria

- [ ] `ChainValidationCheck` type defines available check types
- [ ] `ChainValidationResult` interface with success, check type, and feedback
- [ ] `ChainValidationConfig` interface for per-chain and global configuration
- [ ] `ChainCompletionGateResult` aggregates all validation results
- [ ] Types are exported from `packages/core/src/index.ts`

---

## Constraints

- Follow existing type patterns in `packages/core/src/workflow/types.ts`
- Use discriminated unions where appropriate
- Keep types minimal — only what's needed for the gate

---

## Notes

Reference the CR implementation notes for the validation checks:
1. Task state — All tasks in `done/` directory
2. Completion notes — Each task file has completion notes
3. Acceptance criteria — Checkboxes in task files are checked
4. Design doc updates — If chain scope includes design docs, verify they were modified
5. Test coverage — If chain includes impl tasks, verify tests exist

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
