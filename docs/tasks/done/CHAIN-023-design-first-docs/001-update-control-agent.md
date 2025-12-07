# Task: Update Control Agent Documentation

**Chain**: CHAIN-023-design-first-docs  
**Task**: 001-update-control-agent  
**Type**: implementation  
**Status**: todo  

---

## Objective

Update `docs/agents/control-agent.md` to explicitly document the design chain → implementation chain workflow sequence.

---

## Context

The current control-agent.md workflow section jumps straight to "Create Task Chain" without distinguishing between design and implementation chains. ADR-006 defines chain types and pairing, but this isn't reflected in the control agent workflow.

---

## Acceptance Criteria

- [ ] Add new section "### 2a. Create Design Chain (if needed)" before implementation
- [ ] Explain when design chains are required vs optional
- [ ] Show the chain pairing pattern (design chain → implementation chain)
- [ ] Reference ADR-006 for chain type definitions
- [ ] Update section numbering as needed

---

## Files to Modify

- `docs/agents/control-agent.md`

---

## Verification

```bash
# Check the file was updated
cat docs/agents/control-agent.md | grep -A 20 "Design Chain"
```
