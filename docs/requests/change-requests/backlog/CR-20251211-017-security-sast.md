# Change Request: Security SAST Integration

**ID**: CR-20251211-017  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Add Static Application Security Testing (SAST) capabilities to detect security anti-patterns in source code, including SQL injection, XSS, path traversal, and insecure cryptography.

---

## Why

Dependency scanning and secret detection catch external risks, but SAST catches security issues in the code itself. Agent-generated code may use insecure patterns learned from training data. SAST provides automated detection of these issues before they become vulnerabilities.

---

## Scope

**In Scope**:
- SAST rule engine for TypeScript/JavaScript
- Built-in rules for common vulnerabilities:
  - SQL injection (string concatenation in queries)
  - XSS (unescaped output)
  - Path traversal (unsanitized path inputs)
  - Hardcoded credentials
  - Insecure cryptography (weak algorithms)
  - Unsafe deserialization
- Rule severity configuration
- License compliance checking
- GitHub Advisory database integration
- `choragen security:code` CLI command

**Out of Scope**:
- Web dashboard (CR-20251211-018)
- Workflow integration (CR-20251211-019)
- Custom SAST rule authoring (future enhancement)

---

## Acceptance Criteria

- [ ] SAST rule engine scans TypeScript/JavaScript files
- [ ] SQL injection detection (string concatenation in query functions)
- [ ] XSS detection (innerHTML, dangerouslySetInnerHTML without sanitization)
- [ ] Path traversal detection (user input in file paths)
- [ ] Hardcoded credential detection (passwords, tokens in source)
- [ ] Insecure crypto detection (MD5, SHA1 for security purposes)
- [ ] Rule severity configuration (error, warning, off)
- [ ] License compliance checking against allowed/denied lists
- [ ] GitHub Advisory database integration for enhanced vulnerability data
- [ ] `choragen security:code` runs SAST scan
- [ ] SAST findings include file, line, message, remediation
- [ ] Findings integrated into security report and score

---

## Affected Design Documents

- [Security Scanning](../../../design/core/features/security-scanning.md)

---

## Linked ADRs

- ADR-015: Security Scanning

---

## Dependencies

- **CR-20251211-016**: Security Core Infrastructure

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create:

```
packages/core/src/security/
├── sast/
│   ├── index.ts
│   ├── engine.ts               # Rule execution engine
│   ├── rules/
│   │   ├── index.ts
│   │   ├── sql-injection.ts
│   │   ├── xss.ts
│   │   ├── path-traversal.ts
│   │   ├── hardcoded-creds.ts
│   │   └── insecure-crypto.ts
│   └── types.ts
├── licenses/
│   ├── index.ts
│   ├── checker.ts              # License compliance
│   └── types.ts
├── vulnerabilities/
│   └── github-advisory.ts      # GitHub Advisory provider
└── __tests__/
    ├── sast.test.ts
    └── licenses.test.ts
```

SAST rule structure:
```typescript
interface SASTRule {
  id: string;
  name: string;
  severity: "critical" | "high" | "medium" | "low";
  detect(ast: AST, file: string): CodeSecurityIssue[];
}
```

Use TypeScript compiler API or a lightweight parser for AST analysis.

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
