# Chain: CHAIN-028-commit-discipline

**Request**: FR-20251207-003  
**Title**: Commit Discipline Enforcement  
**Type**: implementation  
**Skip Design**: true  
**Skip Design Justification**: Bug fix adding validation; extends existing hook patterns  
**Status**: todo  
**Created**: 2025-12-07  

---

## Objective

Prevent uncommitted work from accumulating by adding validation and pre-push blocking.

---

## Tasks

1. `001-create-validator` - Create validate-uncommitted-requests.mjs
2. `002-update-pre-push` - Add check to pre-push hook
3. `003-verify-close` - Verify and close FR

---

## Acceptance Criteria

- [ ] `validate-uncommitted-requests.mjs` detects uncommitted request work
- [ ] Pre-push hook blocks when uncommitted request work exists
- [ ] Clear error messages explain what to do
- [ ] Current state passes (we just committed)
