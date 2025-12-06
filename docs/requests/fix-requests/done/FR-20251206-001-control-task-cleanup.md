# Fix Request: Control Agent Tasks Not Cleaned Up

**ID**: FR-20251206-001  
**Domain**: core  
**Status**: done  
**Severity**: medium  
**Created**: 2025-12-06  
**Owner**: Justin  

---

## Problem

Control-only tasks (verification, CR closure, review) are left in `todo/` even after completion because AGENTS.md doesn't document the cleanup procedure for tasks the control agent executes directly.

---

## Evidence

Task `007-verify-close` in CHAIN-011-init-command was left in `todo/` despite:
- CR-20251206-004 being moved to `done/` with completion notes
- All verification steps having been performed
- The chain being effectively complete

The control agent completed the substance but didn't clean up the task file.

---

## Root Cause

AGENTS.md defines the impl→control handoff clearly:
- Impl agent: "Reports completion (does NOT move task files)"
- Control agent: "Reviews completed work... Approves or sends back for rework"

But there's no procedure for tasks that are **inherently control agent work** (no impl handoff). The workflow assumes all tasks go through impl first.

---

## Proposed Fix

1. Add `**Type**: control | implementation` field to task template
2. Document control-only task procedure in AGENTS.md
3. Update task template to include type field

---

## Acceptance Criteria

- [x] AGENTS.md updated with "Control-Only Tasks" section
- [x] Task template includes optional `**Type**` field
- [x] Procedure clearly states control agent moves own tasks to done/

---

## Linked ADRs

- ADR-001-task-file-format (may need update)

---

## Completion Notes

**Completed**: 2025-12-06

Added "Control-Only Tasks" subsection to AGENTS.md documenting the procedure for tasks that control agents execute directly (verification, review, closure). Updated task template with optional `**Type**` field (`implementation` | `control`) to distinguish task ownership.

**Task Chain**: CHAIN-013-control-task-cleanup (3 tasks completed)
