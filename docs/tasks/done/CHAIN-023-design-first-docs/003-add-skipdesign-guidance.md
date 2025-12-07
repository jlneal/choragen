# Task: Add skipDesign Guidance

**Chain**: CHAIN-023-design-first-docs  
**Task**: 003-add-skipdesign-guidance  
**Type**: implementation  
**Status**: todo  

---

## Objective

Add clear guidance on when `skipDesign` is appropriate, either in control-agent.md or as a dedicated section in DEVELOPMENT_PIPELINE.md.

---

## Context

ADR-006 mentions skipDesign but doesn't provide detailed guidance on when it's appropriate. Users need clear criteria to decide whether to create a design chain or use skipDesign.

---

## Acceptance Criteria

- [ ] Document when skipDesign IS appropriate:
  - Hotfixes for production bugs
  - Trivial changes (typo fixes, formatting)
  - Documentation-only changes
  - Tooling/infrastructure (CI, build config)
  - Changes where CR already contains sufficient design
- [ ] Document when skipDesign is NOT appropriate:
  - New features
  - API changes
  - Architecture changes
  - Changes affecting multiple packages
- [ ] Require justification string for all skipDesign uses
- [ ] Add examples of good vs bad skipDesign justifications

---

## Files to Modify

- `docs/agents/control-agent.md` (add skipDesign guidance section)

---

## Verification

```bash
# Check the file was updated
cat docs/agents/control-agent.md | grep -A 30 "skipDesign"
```
