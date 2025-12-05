# Choragen

> χώρα (chora) + agent — *The space that enables agents to actualize intent*

Choragen is a framework for agentic software development. It provides the structure, governance, and coordination primitives that transform a stateless language model into a stateful, accountable worker capable of collaborating on long-running projects.

## What is this?

When you give an AI coding assistant a task, it operates without memory, without accountability, and without coordination with other workers. Choragen changes that by providing:

- **Task Chains** — Break work into context-window-sized chunks with persistent state
- **Governance** — Define what mutations are allowed, require approval, or forbidden
- **Coordination** — File locking and collision detection for parallel work
- **Traceability** — Every change links back to intent (Request → Design → ADR → Code → Test)
- **Contracts** — Runtime validation that implementation matches design intent

## Philosophy

The name comes from Plato's *Timaeus*, where **chora** (χώρα) is the receptacle—the space in which forms become instantiated into matter. Choragen is the medium that receives your intent and enables agents to give it concrete form.

## Packages

| Package | Description |
|---------|-------------|
| `@choragen/core` | Task chains, governance, locks, and protocol primitives |
| `@choragen/cli` | Command-line interface for all operations |
| `@choragen/contracts` | Runtime design contracts, API errors, HTTP status |
| `@choragen/eslint-plugin` | ESLint rules for traceability and quality |
| `@choragen/test-utils` | Testing utilities (unsafeCast, structured output) |

## Quick Start

```bash
# Install the CLI
pnpm add -D @choragen/cli

# Initialize in your project
npx choragen init

# Create a task chain from a change request
npx choragen chain:new CR-20251205-001 my-feature

# Start working
npx choragen task:start CHAIN-001-my-feature/001-setup
```

## Status

🚧 **Under Development** — This project is being extracted from [itinerary-planner](https://github.com/jlneal/itinerary-planner) where the methodology was developed and battle-tested.

See the [Architecture](docs/architecture.md) document for the full system design.

## License

MIT
