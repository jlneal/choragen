# Chain: CHAIN-026-expand-adr-coverage

**Request**: FR-20251207-002  
**Title**: Expand ADR Reference Coverage  
**Type**: implementation  
**Skip Design**: true  
**Skip Design Justification**: Bug fix extending existing validation pattern; no new architecture needed  
**Status**: todo  
**Created**: 2025-12-07  

---

## Objective

Expand the ADR reference validation to cover all "executable" artifacts—anything that does something should trace back to a decision.

---

## Tasks

1. `001-update-validator` - Expand validate-source-adr-references.mjs patterns
2. `002-add-adr-refs` - Add ADR references to existing scripts/configs
3. `003-verify-close` - Verify and close FR

---

## Acceptance Criteria

- [ ] Validator covers: `.github/workflows/*.yml`, `scripts/*.mjs`, config files, githooks
- [ ] Exemption patterns configurable
- [ ] All covered files have ADR refs or are exempted
- [ ] Validator passes
