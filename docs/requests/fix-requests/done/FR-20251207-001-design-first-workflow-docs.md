# Fix Request: Design-First Workflow Documentation Gap

**ID**: FR-20251207-001  
**Domain**: docs  
**Status**: todo  
**Severity**: medium  
**Created**: 2025-12-07  
**Owner**: agent  

---

## Problem

The documentation does not clearly explain that design chains should be created and completed before implementation chains. While ADR-006 defines chain types and pairing, the control-agent workflow and DEVELOPMENT_PIPELINE.md don't make this sequence explicit.

**Current gaps**:
1. `control-agent.md` jumps to "Create Task Chain" without specifying design vs implementation
2. `DEVELOPMENT_PIPELINE.md` shows the conceptual flow but doesn't connect it to chain types
3. No explicit guidance on when to use `skipDesign` vs creating a design chain
4. No example of the full design → implementation chain pairing workflow

---

## Impact

- Agents may skip design chains when they shouldn't
- Inconsistent application of design-first principle
- New users/agents don't understand the intended workflow
- Traceability suffers when design chains are skipped inappropriately

---

## Proposed Fix

1. Update `control-agent.md` to explicitly show design chain → implementation chain sequence
2. Update `DEVELOPMENT_PIPELINE.md` to connect the conceptual flow to chain types
3. Add clear guidance on when `skipDesign` is appropriate
4. Add an example showing the full paired-chain workflow

---

## Affected Files

- docs/agents/control-agent.md
- docs/design/DEVELOPMENT_PIPELINE.md
- docs/agents/handoff-templates.md (may need design chain handoff template)

---

## Linked ADRs

- ADR-006-chain-type-system (defines the chain types this FR documents)

---

## Commits

No commits yet.

---

## Completion Notes

**Completed**: 2025-12-07  
**Chain**: CHAIN-023-design-first-docs

### Changes Made

1. **control-agent.md** - Added "2. Plan Chain Sequence" section with:
   - Design vs implementation chain comparison table
   - When design chains are required vs optional
   - Chain pairing pattern with diagram
   - Expanded skipDesign guidance with good/bad justification examples

2. **DEVELOPMENT_PIPELINE.md** - Added "Chain Types and the Pipeline" section with:
   - ASCII diagram mapping chain types to pipeline stages
   - Chain pairing pattern
   - skipDesign exception documentation

The design-first workflow is now explicitly documented with clear guidance on when to use design chains vs skipDesign.
