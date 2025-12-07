# Task: Verify and Close FR

**Chain**: CHAIN-028-commit-discipline  
**Task**: 003-verify-close  
**Type**: control  
**Status**: todo  

---

## Objective

Verify commit discipline enforcement works and close FR-20251207-003.

---

## Verification

1. Run validator on clean state: should pass
2. Create uncommitted change + done request: should fail
3. Commit the change: should pass again
4. Test pre-push hook blocks appropriately

---

## Post-Verification

1. Move task files to done
2. Update FR with completion notes
3. Move FR to done
4. **Commit this work** (practice what we preach!)

---

## Commit Format

```
fix(hooks): add commit discipline enforcement

- Add validate-uncommitted-requests.mjs
- Update pre-push hook to block uncommitted request work
- Clear error messages with fix instructions

FR-20251207-003
```
