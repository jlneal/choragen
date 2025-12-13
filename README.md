# Choragen

> χώρα (chora) + agent — *The space that enables agents to actualize intent*

**Choragen is a steering wheel for very fast agentic development.**

It's not about slowing down to be safe. It's about going faster *because* you have control.

## The Problem

The human is the bottleneck—no matter where they are in the loop.

- **Writing code?** Limited by typing speed and mental model.
- **Reviewing AI code?** Limited by reading speed and attention.
- **Prompting AI?** Limited by iteration cycles and context loss.

Current AI coding tools keep humans at the code level. You watch every line, review every change, approve every edit. That's not leverage—that's supervision.

## The Philosophy

**Let go of the code. Elevate to control structures.**

The fastest path isn't watching AI write code. It's defining *what* should be built, setting *boundaries* for how it's built, and letting agents execute at full speed while you monitor trajectories—not tokens.

Think of it like driving:
- **Vibe coding** = No steering wheel, just hoping the car goes somewhere useful
- **Current AI tools** = Micromanaging every turn of the wheel
- **Choragen** = Setting the destination, monitoring the route, intervening only when needed

The governance isn't friction. It's what lets you take your hands off the wheel.

## What Choragen Provides

### Control Structures (Not Code Review)

- **Task Chains** — Break work into agent-sized chunks with persistent state
- **Role Separation** — Control agents orchestrate, impl agents execute
- **Governance** — Define boundaries that are *enforced*, not suggested
- **Traceability** — Every change links back to intent (Request → Design → ADR → Code)

### Agent Runtime

The CLI spawns and orchestrates agent sessions directly:

```bash
# Start a control agent session
choragen agent:start --role=control

# The control agent:
# 1. Analyzes the backlog
# 2. Creates task chains
# 3. Spawns impl agents for each task
# 4. Reviews and approves completed work
# 5. All without human intervention
```

You don't copy prompts between sessions. You don't review every file change. You monitor the *trajectory* and intervene at the *control* level.

## Packages

| Package | Description |
|---------|-------------|
| `@choragen/core` | Task chains, governance, locks, and protocol primitives |
| `@choragen/cli` | Command-line interface and agent runtime |
| `@choragen/contracts` | Runtime design contracts, API errors, HTTP status |
| `@choragen/eslint-plugin` | ESLint rules for traceability and quality |
| `@choragen/test-utils` | Testing utilities |

## Quick Start

```bash
# Initialize Choragen in your project
npx choragen init

# Create a change request
npx choragen cr:new my-feature "Add user authentication"

# Create a task chain
npx choragen chain:new CR-20251207-001 auth-feature

# Add tasks
npx choragen task:add CHAIN-001-auth-feature setup "Set up auth infrastructure"
npx choragen task:add CHAIN-001-auth-feature implement "Implement auth flow"

# Start the agent runtime
npx choragen agent:start --role=control
```

## Workflow Chat Quick Start

```bash
# Start the web dashboard
pnpm --filter @choragen/web dev

# Open http://localhost:3000/chat
# - Start a workflow or pick one from History (`packages/web/src/app/chat/history/page.tsx`)
# - Chat with an active workflow (`packages/web/src/app/chat/[workflowId]/page.tsx`)
# - Pause/Resume/Cancel from the sidebar (`packages/web/src/components/chat/workflow-sidebar.tsx`)
# - Live messages and error handling via chat components (`packages/web/src/components/chat/`)
# - Workflow API routes power the UI (`packages/web/src/server/routers/workflow.ts`)
```

## Who This Is For

Choragen is for developers who:

- **Trust process over inspection** — Believe well-structured workflows produce good outcomes
- **Want to operate at intent level** — Define what, not how
- **Are willing to let go** — Trade code-level visibility for velocity
- **Need reliability at speed** — Can't afford "vibe coded" chaos

If you want to review every line of AI-generated code, Choragen isn't for you. Use Cursor or Copilot.

If you want to ship 10x faster by elevating your role from coder to navigator, keep reading.

## Status

🚧 **Under Active Development**

The framework is being extracted from itinerary-planner and enhanced with the Agent Runtime (see [CR-20251207-025](docs/requests/change-requests/todo/CR-20251207-025-agent-runtime-core.md)).

Current focus:
- [x] Task chains and governance
- [x] CLI commands for chain/task management
- [x] Traceability validation
- [x] Agent Runtime with role-gated tools and governance enforcement
- [x] Multi-provider LLM support (Anthropic, OpenAI, Gemini, Ollama)
- [x] Web dashboard with workflow chat interface

See [docs/design/core/features/agent-runtime.md](docs/design/core/features/agent-runtime.md) for the full roadmap.

## Documentation

- [Architecture](docs/architecture.md) — System design overview
- [Development Pipeline](docs/design/DEVELOPMENT_PIPELINE.md) — How work flows from intent to code
- [Agent Runtime](docs/design/core/features/agent-runtime.md) — The autonomous orchestration layer
- [AGENTS.md](AGENTS.md) — Guidelines for AI agents working in this codebase

## License

MIT
