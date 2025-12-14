# Task: Create Fix Reflection Design Document

**Chain**: CHAIN-078-fix-reflection  
**Task**: 006  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-14

---

## Objective

Create the `fix-reflection.md` design document in `docs/design/core/features/` that describes the fix reflection system.

---

## Context

CR-20251213-001 specifies a new design document for the fix reflection feature. This document should capture the design decisions, data model, and integration points.

---

## Expected Files

- `docs/design/core/features/fix-reflection.md`

---

## Acceptance Criteria

- [ ] Design doc created with proper structure (Overview, Problem, Solution, Data Model, etc.)
- [ ] Documents the reflection section in FR template
- [ ] Documents the extended FeedbackItem fields (source, category, promotedTo)
- [ ] Documents the reflection stage in workflow system
- [ ] Documents the feedback:promote CLI command
- [ ] Documents improvement categories with examples
- [ ] Links to related design docs (agent-feedback.md, workflow-orchestration.md)
- [ ] Links to CR-20251213-001

---

## Constraints

- Follow existing design doc conventions
- Must accurately reflect the revised approach (FeedbackItem extension, not separate SuggestionManager)

---

## Notes

Key sections to include:
1. Overview - What the reflection system does
2. Problem - Why reflection is needed
3. Solution - How it works
4. Data Model - Extended FeedbackItem fields
5. Workflow Integration - Reflection stage
6. CLI Commands - feedback:promote
7. Acceptance Criteria
8. Linked ADRs/Features

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
