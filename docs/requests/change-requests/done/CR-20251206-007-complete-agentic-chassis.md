# Change Request: Complete Agentic Chassis Port

**ID**: CR-20251206-007  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-06  
**Owner**: Justin  

---

## What

Complete the port of the agentic development chassis from itinerary-planner to choragen. The architecture is correct but implementation is ~60-70% complete. This CR addresses the gaps to make choragen rock-solid.

---

## Why

Choragen should be the canonical implementation of the agentic chassis. Currently:
- Git hooks don't enforce as strictly as itinerary-planner
- CLI is missing document creation commands
- ESLint rules exist but aren't enforced on choragen itself
- AGENTS.md lacks the "cookbook" patterns that make agents effective

---

## Gap Analysis

### 1. Git Hooks (Priority 1)

**Pre-commit gaps**:
- [ ] Format staged files
- [ ] Validate package.json ↔ pnpm-lock.yaml sync
- [ ] Run lint on staged files
- [ ] Contextual validation (run validators based on what changed)

**Commit-msg gaps**:
- [ ] BLOCK commits to `todo/` requests (not just warn)
- [ ] BLOCK commits to archived requests
- [ ] Validate scope matches changed files

### 2. ESLint Enforcement (Priority 1)

- [ ] Create `eslint.config.mjs` that uses `@choragen/eslint-plugin`
- [ ] Enforce rules on choragen itself (dogfooding)
- [ ] Add to pre-commit hook

### 3. CLI Commands (Priority 2)

**Document creation**:
- [ ] `choragen cr:new <slug> [title]`
- [ ] `choragen fr:new <slug> [title]`
- [ ] `choragen adr:new <slug> [title]`
- [ ] `choragen adr:archive <file>`
- [ ] `choragen design:new <type> <slug>` (persona, scenario, use-case, feature, enhancement)

**Validation wrappers**:
- [ ] `choragen validate:links`
- [ ] `choragen validate:traceability`
- [ ] `choragen validate:adr`
- [ ] `choragen validate:requests`
- [ ] `choragen validate:all`

**Utilities**:
- [ ] `choragen work:incomplete` - List all incomplete work

### 4. AGENTS.md Expansion (Priority 3)

- [ ] Common patterns section (copy-paste ready)
- [ ] Error handling patterns
- [ ] Test traceability workflow
- [ ] Validation commands reference
- [ ] Structured output for agents

### 5. Task Runner (Priority 4)

- [ ] Create `scripts/run.mjs` or equivalent
- [ ] Wrap all commands with consistent interface
- [ ] JSON output for agent consumption

---

## Scope

**In Scope**:
- Strengthen git hooks
- Wire up ESLint enforcement
- Add CLI commands for document creation
- Expand AGENTS.md with patterns
- Add task runner infrastructure

**Out of Scope**:
- New ESLint rules (already have 34)
- New validation scripts (already have 14)
- MCP server (separate CR-20251206-003)

---

## Acceptance Criteria

- [x] Pre-commit hook runs contextual validations
- [x] Commit-msg hook blocks commits to todo/ requests
- [x] ESLint rules enforced on choragen codebase
- [x] `choragen cr:new` and `choragen fr:new` work
- [x] `choragen adr:new` works
- [x] `choragen validate:all` runs all validators
- [x] AGENTS.md has common patterns section
- [x] All validation scripts pass on choragen itself

---

## Estimated Effort

| Component | Tasks | Time |
|-----------|-------|------|
| Git hooks | 2 | 2-3 hours |
| ESLint setup | 1 | 1-2 hours |
| CLI commands | 3-4 | 4-6 hours |
| AGENTS.md | 1 | 2-3 hours |
| Task runner | 1 | 2-3 hours |
| **Total** | **8-10** | **~2 days** |

---

## Linked ADRs

- ADR-001-task-file-format
- ADR-002-governance-schema

---

## Completion Notes

**Completed**: 2025-12-06

Completed the port of the agentic development chassis from itinerary-planner to choragen.

**Task Chain**: CHAIN-016-agentic-chassis (8 tasks completed)

**Key Deliverables**:
- Strengthened git hooks (pre-commit with contextual validation, commit-msg blocks todo/ commits)
- ESLint enforcement with 6 universal rules from @choragen/eslint-plugin
- CLI document commands: cr:new, fr:new, adr:new, design:new, cr:close, adr:archive
- CLI validation commands: 13 validators + validate:all, validate:quick, validate:ci
- work:incomplete utility for tracking stale work
- Expanded AGENTS.md from 206 to 527 lines with cookbook patterns
- Task runner (scripts/run.mjs) with --json output for agents
