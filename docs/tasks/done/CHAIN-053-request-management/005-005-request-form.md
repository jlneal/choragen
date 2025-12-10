# Task: Create RequestForm component

**Chain**: CHAIN-053-request-management  
**Task**: 005-005-request-form  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-10

---

## Objective

Create a `RequestForm` React component for creating and editing requests.

The form should:
1. Support both CR and FR creation
2. Include fields for all required metadata
3. Provide markdown preview for description
4. Handle form validation and submission

---

## Expected Files

- `packages/web/src/components/requests/request-form.tsx` (create)
- `packages/web/src/components/requests/index.ts` (modify - add export)

---

## Acceptance Criteria

- [ ] Form has type selector (Change Request / Fix Request)
- [ ] Required fields: title, domain
- [ ] Optional fields: description, owner, severity (FR only), tags
- [ ] Domain field is a dropdown with common values + custom input
- [ ] Severity field only shows when type is Fix Request
- [ ] Form validates required fields before submission
- [ ] Calls `requests.create` mutation on submit
- [ ] Shows loading state during submission
- [ ] Redirects to new request on success
- [ ] Uses shadcn/ui form components

---

## Notes

Follow existing component patterns in `packages/web/src/components/`. Use `react-hook-form` with zod validation if available, otherwise use controlled inputs.

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
