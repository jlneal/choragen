# Fix Request: Web Server EADDRINUSE on Port 3000

**ID**: FR-20251214-001  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-14  
**Severity**: medium  
**Owner**: agent  

---

## Problem

The web server crashes with `EADDRINUSE` error when port 3000 is already in use by another process. This prevents the server from starting and provides no graceful fallback or helpful error message.

---

## Expected Behavior

The server should either:
1. Detect the port conflict and provide a clear error message with guidance on how to resolve it
2. Or attempt to find an available port and use that instead

---

## Actual Behavior

The server throws an uncaught exception and crashes:

```
⨯ uncaughtException: Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1940:16)
    at listenInCluster (node:net:1997:12)
    at Server.listen (node:net:2102:7)
    at startServer (/Users/justin/Projects/choragen/packages/web/server.ts:34:10) {
  code: 'EADDRINUSE',
  errno: -48,
  syscall: 'listen',
  address: '::',
  port: 3000
}
```

---

## Steps to Reproduce

1. Start the web server with `pnpm --filter @choragen/web dev`
2. In another terminal, start the web server again
3. Observe the EADDRINUSE crash

---

## Root Cause Analysis

The `server.listen()` call at line 34 of `server.ts` does not handle the `error` event on the server. When the port is already in use, Node.js emits an `error` event which, if unhandled, becomes an uncaught exception.

---

## Proposed Fix

Add an error handler to the HTTP server that:
1. Catches `EADDRINUSE` errors specifically
2. Provides a clear, actionable error message
3. Exits gracefully with a non-zero exit code

---

## Affected Files

- `packages/web/server.ts`

---

## Linked ADRs

- ADR-011-web-api-architecture

---

## Commits

No commits yet.

---

## Verification

- [ ] Bug no longer reproducible
- [ ] Regression test added
- [ ] Related functionality still works

---

## Reflection

**Why did this occur?**
Standard Node.js server setup without error handling for common port conflicts.

**What allowed it to reach this stage?**
Development environment typically doesn't encounter port conflicts unless running multiple instances.

**How could it be prevented?**
Include error handling as part of standard server setup patterns.

**Suggested improvements**:
- Category: developer-experience
- Description: Add server error handling to web package boilerplate

---

## Completion Notes

[Added when moved to done/]
