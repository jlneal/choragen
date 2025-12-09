# Change Request: Interactive Agent Menu

**ID**: CR-20251208-001  
**Domain**: cli  
**Status**: done  
**Created**: 2025-12-08  
**Owner**: control-agent  

---

## What

Add a menu-driven interactive interface for the agent runtime, making it easy to start sessions, manage settings, and monitor progress without memorizing CLI flags.

---

## Why

The current CLI requires users to remember flags like `--role`, `--provider`, `--max-tokens`, etc. A menu-driven interface would:

- Lower the barrier to entry for new users
- Provide discoverability of features
- Allow interactive configuration of sessions
- Show real-time session status and history

---

## Scope

**In Scope**:
- Interactive menu launcher (`choragen agent` with no subcommand)
- Session configuration wizard (role, provider, model, limits)
- Session history browser
- Live session monitoring
- Quick actions (resume, cleanup, list)

**Out of Scope**:
- Web UI (future feature)
- GUI application
- Remote session management

---

## Acceptance Criteria

### Menu Launcher
- [x] `choragen agent` (no args) launches interactive menu
- [x] Arrow key navigation with Enter to select
- [x] Escape or 'q' to exit
- [x] Color-coded output for better UX

### Main Menu Options
- [x] **Start New Session** - wizard to configure and start
- [x] **Resume Session** - list paused sessions, select to resume
- [x] **List Sessions** - show all sessions with status
- [x] **Cleanup Sessions** - interactive cleanup with confirmation
- [x] **Settings** - configure defaults (provider, model, limits)
- [x] **Exit**

### Start Session Wizard
- [x] Select role: impl / control
- [x] Select provider: anthropic / openai / gemini / ollama
- [x] Select or enter model name
- [x] Set token limit (optional, with sensible default)
- [x] Set cost limit (optional, with sensible default)
- [x] Enable/disable approval prompts
- [x] Enter task description (multi-line input)
- [x] Confirm and start

### Session Monitor
- [x] Show live token count and cost
- [x] Show current tool being executed
- [x] Show session status (running/paused/completed)
- [x] Allow pause (Ctrl+C handled gracefully)

### Settings Persistence
- [x] Save defaults to `.choragen/user-settings.yaml`
- [x] Load defaults on menu launch
- [x] Allow override per-session

---

## Implementation Notes

### Menu Library Options

```typescript
// Option 1: inquirer (popular, full-featured)
import inquirer from 'inquirer';

// Option 2: prompts (lightweight)
import prompts from 'prompts';

// Option 3: @clack/prompts (modern, beautiful)
import * as p from '@clack/prompts';
```

Recommend `@clack/prompts` for modern aesthetics and good DX.

### Menu Structure

```
┌─────────────────────────────────────────┐
│  🤖 Choragen Agent Runtime              │
├─────────────────────────────────────────┤
│                                         │
│  ▸ Start New Session                    │
│    Resume Session (2 paused)            │
│    List Sessions                        │
│    Cleanup Old Sessions                 │
│    Settings                             │
│    Exit                                 │
│                                         │
└─────────────────────────────────────────┘
```

### Start Session Flow

```
┌─ Start New Session ─────────────────────┐
│                                         │
│  Role:     ○ impl  ● control            │
│  Provider: ● anthropic ○ openai ○ ollama│
│  Model:    claude-3-5-sonnet-20241022   │
│                                         │
│  Token Limit: 100000 (optional)         │
│  Cost Limit:  $5.00 (optional)          │
│                                         │
│  ☐ Require approval for sensitive ops   │
│                                         │
│  Task Description:                      │
│  ┌─────────────────────────────────────┐│
│  │ Implement the retry module with    ││
│  │ exponential backoff...             ││
│  └─────────────────────────────────────┘│
│                                         │
│  [ Start Session ]  [ Cancel ]          │
└─────────────────────────────────────────┘
```

---

## Linked Design Documents

- [Agent Runtime](../../design/core/features/agent-runtime.md)

---

## Linked ADRs

- ADR-007: Agent Runtime Architecture

---

## Commits

[Pending commit by user]

---

## Completion Notes

**Completed**: 2025-12-08

**Chain**: CHAIN-041-interactive-menu (6 tasks, all done)

**Summary**: Implemented full interactive menu system using `@clack/prompts`:
- Menu launcher via `choragen agent` command
- Start Session wizard with role, provider, model, limits, approval settings
- Session browser for listing/resuming sessions with filtering
- Settings persistence to `.choragen/user-settings.yaml`
- 146 new tests (761 total CLI tests)

**Files Created**:
- `packages/cli/src/menu/` - Menu module (8 files)
- `packages/cli/src/config/` - Config persistence (3 files)
- `packages/cli/src/__tests__/menu/` - Menu tests (6 files)
- `packages/cli/src/__tests__/config/` - Config tests (1 file)
