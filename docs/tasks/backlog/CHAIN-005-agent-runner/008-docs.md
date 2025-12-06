# Task: Documentation and close CR

**Chain**: CHAIN-005-agent-runner  
**Task**: 008-docs  
**Status**: backlog  
**Created**: 2025-12-06

---

## Objective

Add documentation and close CR-20251206-003.

---

## Expected Files

Create:
- `packages/agent-runner/README.md` - Package documentation
- `docs/adr/done/ADR-004-agent-runner.md` - Architecture decision record

Update:
- `docs/requests/change-requests/done/CR-20251206-003-mcp-server-orchestration.md`

---

## Acceptance Criteria

- [ ] README documents usage, configuration, and examples
- [ ] ADR-004 documents design decisions
- [ ] CR moved to done/ with completion notes
- [ ] `pnpm build` passes
- [ ] `pnpm test` passes

---

## Notes

**README.md** should cover:
- What the package does
- Installation
- Configuration (API keys)
- Usage example
- Tool reference

**ADR-004** should document:
- Decision to build custom vs use Aider
- Multi-provider support
- Tool selection rationale
- Security considerations

**Verification**:
```bash
pnpm build
pnpm test
```
