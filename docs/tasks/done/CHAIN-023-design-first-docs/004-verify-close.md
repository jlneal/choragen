# Task: Verify and Close FR

**Chain**: CHAIN-023-design-first-docs  
**Task**: 004-verify-close  
**Type**: control  
**Status**: todo  

---

## Objective

Verify all documentation updates are complete and close FR-20251207-001.

---

## Acceptance Criteria

- [ ] control-agent.md has design chain workflow section
- [ ] DEVELOPMENT_PIPELINE.md connects flow to chain types
- [ ] skipDesign guidance is documented
- [ ] All task files moved to done/CHAIN-023-design-first-docs/
- [ ] FR-20251207-001 moved to done/ with completion notes
- [ ] Commit with proper format

---

## Verification

```bash
# Check documentation updates
grep -l "design chain" docs/agents/control-agent.md
grep -l "Chain Types" docs/design/DEVELOPMENT_PIPELINE.md
grep -l "skipDesign" docs/agents/control-agent.md
```

---

## Commit Format

```
docs(agents): clarify design-first workflow

- Add design chain workflow to control-agent.md
- Connect chain types to DEVELOPMENT_PIPELINE.md
- Add skipDesign guidance and criteria

FR-20251207-001
```
