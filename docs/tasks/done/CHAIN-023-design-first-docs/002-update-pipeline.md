# Task: Update Development Pipeline Documentation

**Chain**: CHAIN-023-design-first-docs  
**Task**: 002-update-pipeline  
**Type**: implementation  
**Status**: todo  

---

## Objective

Update `docs/design/DEVELOPMENT_PIPELINE.md` to connect the conceptual flow (Request → Design → ADR → Implementation) to the chain type system.

---

## Context

DEVELOPMENT_PIPELINE.md shows the conceptual flow but doesn't explain how chain types (`design` vs `implementation`) map to this flow. Users need to understand that:
- Design chains produce design docs and ADRs
- Implementation chains produce code and tests
- Implementation chains should depend on design chains (or use skipDesign)

---

## Acceptance Criteria

- [ ] Add new section "## Chain Types and the Pipeline"
- [ ] Explain how design chains map to "Design Documents" and "ADRs" stages
- [ ] Explain how implementation chains map to "Implementation" stage
- [ ] Show the chain pairing pattern with a diagram
- [ ] Reference ADR-006

---

## Files to Modify

- `docs/design/DEVELOPMENT_PIPELINE.md`

---

## Verification

```bash
# Check the file was updated
cat docs/design/DEVELOPMENT_PIPELINE.md | grep -A 30 "Chain Types"
```
