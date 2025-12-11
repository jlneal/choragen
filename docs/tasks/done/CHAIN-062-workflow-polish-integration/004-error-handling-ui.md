# Task: Add error message display with retry options

**Chain**: CHAIN-062-workflow-polish-integration  
**Task**: 004-error-handling-ui  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-11

---

## Objective

Create error message display component with clear error messages and retry options where applicable. Improve error UX throughout the chat interface.

---

## Expected Files

- `packages/web/src/components/chat/error-message.tsx — Error display component`
- `packages/web/src/components/chat/chat-container.tsx — Integrate error handling`
- `packages/web/src/__tests__/components/chat/error-message.test.tsx — Tests`

---

## Acceptance Criteria

- [ ] ErrorMessage component displays error with icon and message
- [ ] Retry button shown for recoverable errors
- [ ] Dismiss button for non-critical errors
- [ ] Error styling is distinct but not alarming (red accent, not full red background)
- [ ] Network errors show "Connection lost" with auto-retry option
- [ ] API errors show user-friendly message, not raw error

---

## Notes

_No notes yet._

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
