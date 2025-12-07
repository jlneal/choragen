# Task: Simplify root AGENTS.md to reference role docs

**Chain**: CHAIN-019-role-separation  
**Task**: 002-simplify-root-agents  
**Status**: todo  
**Created**: 2025-12-07

---

## Objective

Simplify the root AGENTS.md file by extracting role-specific content to the new docs/agents/ files. Keep only common patterns and references.

---

## Expected Files

- `AGENTS.md (modified - significantly smaller)`

---

## Acceptance Criteria

- [ ] Remove "Agent Roles" section (moved to docs/agents/)
- [ ] Remove "Control-Only Tasks" section (moved to docs/agents/control-agent.md)
- [ ] Remove "Handoff Prompt Template" section (moved to docs/agents/handoff-templates.md)
- [ ] Remove "CRITICAL: Never Skip the System" section (moved to docs/agents/control-agent.md)
- [ ] Add "Agent Roles" section with links to docs/agents/*.md
- [ ] Keep "Common Patterns" section (copy-paste ready code)
- [ ] Keep "Project Overview" section
- [ ] Keep "Documentation Structure" section
- [ ] Keep "Validation Commands" section
- [ ] Keep "Package Structure" section
- [ ] Keep "CLI Commands" section
- [ ] File should be under 200 lines (currently ~530 lines)

---

## Notes

The goal is to make AGENTS.md a quick reference, not a comprehensive manual. Role-specific details live in docs/agents/.
