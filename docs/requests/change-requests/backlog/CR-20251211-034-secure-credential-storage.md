# Change Request: Secure Credential Storage

**ID**: CR-20251211-034  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Replace plaintext API key storage in `.choragen/config.json` with OS-level secure credential storage using the system keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service).

---

## Why

The current approach (CR-20251211-001) stores API keys in a plaintext JSON file. While this is similar to `.env` files and acceptable for local development, it has risks:

- **Accidental exposure** — File could be committed, backed up, or synced
- **No encryption at rest** — Keys readable by any process with file access
- **No access control** — No authentication required to read keys

OS keychains provide:
- Encrypted storage
- User authentication (password/biometric) for access
- Standard security model users already trust

This CR improves security for users who want stronger guarantees.

---

## Scope

**In Scope**:
- Integrate `keytar` or similar library for cross-platform keychain access
- Store API keys in OS keychain instead of config file
- Migration path from config file to keychain
- Fallback to config file if keychain unavailable
- Settings UI indicates storage method (keychain vs file)
- CLI command to migrate keys: `choragen config:secure`

**Out of Scope**:
- Hardware security modules (HSM)
- Remote/cloud key management
- Key rotation policies

---

## Acceptance Criteria

- [ ] API keys stored in OS keychain by default (if available)
- [ ] Fallback to config file on systems without keychain support
- [ ] Settings page shows storage method (Keychain / File)
- [ ] `choragen config:secure` migrates keys from file to keychain
- [ ] `choragen config:export` exports keys to file (with warning)
- [ ] Existing config file keys are migrated on first run
- [ ] Works on macOS, Windows, and Linux (with libsecret)

---

## Affected Design Documents

- [Agent Runtime](../../../design/core/features/agent-runtime.md)
- [Web Chat Interface](../../../design/core/features/web-chat-interface.md)

---

## Linked ADRs

- ADR-011: Web API Architecture

---

## Dependencies

- **CR-20251211-001**: API Key Settings (establishes config structure first)

---

## Commits

No commits yet.

---

## Implementation Notes

Recommended library: `keytar` (Electron's keychain library, works standalone)
- https://github.com/nicholasrice/keytar

Alternative: `keychain` (macOS only) or native bindings

Key storage schema:
```
Service: "choragen"
Account: "anthropic-api-key" | "openai-api-key" | "google-api-key"
Password: <the actual key>
```

Migration flow:
1. On startup, check if config file has keys
2. If keychain available, offer to migrate
3. After migration, remove keys from config file
4. Store flag in config: `{ "credentialStorage": "keychain" }`

Note: `keytar` requires native compilation, which may complicate installation on some systems. Consider making this an optional dependency.

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
