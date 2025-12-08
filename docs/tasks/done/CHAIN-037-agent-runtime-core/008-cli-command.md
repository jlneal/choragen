# Task: CLI Command (agent:start)

**Chain**: CHAIN-037-agent-runtime-core  
**Task**: 008-cli-command  
**Status**: done  
**Type**: impl  
**Created**: 2025-12-08

---

## Objective

Create the `choragen agent:start` CLI command that starts an agent session.

---

## Context

This is the user-facing entry point. The command:
1. Parses CLI arguments (role, model, chain, task, dry-run)
2. Validates configuration (API keys present, etc.)
3. Creates the LLM provider
4. Starts the agentic loop
5. Displays output to the terminal
6. Records metrics on completion

---

## Expected Files

Create:
- `packages/cli/src/commands/agent.ts` — agent:start command

Modify:
- `packages/cli/src/index.ts` — Register agent command

---

## Acceptance Criteria

- [ ] `choragen agent:start --role=control` starts a control session
- [ ] `choragen agent:start --role=impl` starts an impl session
- [ ] `--model` flag specifies LLM model (default from env)
- [ ] `--chain` flag specifies chain context
- [ ] `--task` flag specifies task context
- [ ] `--dry-run` flag shows what would happen without executing
- [ ] `--provider` flag overrides default provider
- [ ] Validates API key is present for selected provider
- [ ] Displays session header with role, model, session ID
- [ ] Displays tool calls as they happen
- [ ] Displays session summary on completion (tokens, duration)
- [ ] Records session metrics to `.choragen/metrics/`
- [ ] Exit code 0 on success, 1 on error
- [ ] Help text explains all options
- [ ] TypeScript compiles without errors

---

## Constraints

- Use existing CLI patterns from other commands
- Keep output readable but not verbose
- Do NOT implement interactive mode

---

## Notes

**Usage Examples**:
```bash
# Start control agent
choragen agent:start --role=control

# Start impl agent for specific task
choragen agent:start --role=impl --chain=CHAIN-037 --task=001-provider-abstraction

# Use specific model
choragen agent:start --role=control --model=gpt-4o --provider=openai

# Dry run
choragen agent:start --role=control --dry-run
```

**Output Format**:
```
╔═══════════════════════════════════════════════════════════════╗
║  CHORAGEN AGENT RUNTIME                                       ║
║  Role: control | Model: claude-sonnet-4-20250514                      ║
║  Session: session-20251208-143052                             ║
╠═══════════════════════════════════════════════════════════════╣

[Agent] Checking chain status...
> tool: chain:status { chainId: "CHAIN-037-agent-runtime-core" }
> result: 8 tasks, 0 in-progress, 0 done

[Agent] Starting first task...
> tool: task:start { chainId: "CHAIN-037", taskId: "001-provider-abstraction" }
> result: Task moved to in-progress

Session complete.
Duration: 2m 34s | Tokens: 12,450 in / 3,200 out
```

**Environment Variables**:
```bash
CHORAGEN_PROVIDER=anthropic     # Default provider
CHORAGEN_MODEL=claude-sonnet-4-20250514     # Default model
ANTHROPIC_API_KEY=sk-ant-...    # Required for Anthropic
OPENAI_API_KEY=sk-...           # Required for OpenAI
GEMINI_API_KEY=...              # Required for Gemini
```

---

## Task Type Reference

- **impl** (default): Requires handoff to implementation agent in a fresh session
- **control**: Control agent executes directly (e.g., verification, review, closure tasks)
