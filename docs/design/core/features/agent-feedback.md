# Feature: Agent Feedback

**Domain**: core  
**Status**: draft  
**Created**: 2025-12-12  

---

## Overview

Agent Feedback provides a structured mechanism for agents to communicate back to humans during workflow execution. This enables agents to request clarification, ask questions, surface ideas for review, and report blockers without halting the entire workflow.

---

## Problem

Currently, agents have limited ways to communicate with humans:

1. **All-or-nothing gates** — Human approval gates block all progress until satisfied
2. **No structured questions** — Agents can't formally request clarification
3. **Lost context** — Questions asked in chat may be lost across sessions
4. **No prioritization** — All feedback treated equally regardless of urgency

---

## Solution

Introduce a **Feedback** structure that:
- Allows agents to create typed feedback items
- Persists feedback in the workflow state
- Enables humans to respond asynchronously
- Supports prioritization and categorization
- Integrates with the chat interface

---

## Feedback Types

| Type | Purpose | Urgency | Blocks Work? |
|------|---------|---------|--------------|
| **clarification** | Request missing information | Medium | Often yes |
| **question** | Ask about implementation/design choices | Low | Usually no |
| **idea** | Suggest improvements or alternatives | Low | No |
| **blocker** | Report something preventing progress | High | Yes |
| **review** | Request human review of work | Medium | Sometimes |

---

## Data Model

### Feedback Item

```typescript
interface FeedbackItem {
  /** Unique identifier */
  id: string;
  
  /** Workflow this feedback belongs to */
  workflowId: string;
  
  /** Stage index where feedback was created */
  stageIndex: number;
  
  /** Task ID if feedback is task-specific */
  taskId?: string;
  
  /** Chain ID if feedback is chain-specific */
  chainId?: string;
  
  /** Type of feedback */
  type: FeedbackType;
  
  /** Role of the agent that created this feedback */
  createdByRole: string;
  
  /** The feedback content/question */
  content: string;
  
  /** Additional context (code snippets, file refs, etc.) */
  context?: FeedbackContext;
  
  /** Current status */
  status: FeedbackStatus;
  
  /** Human response (when resolved) */
  response?: FeedbackResponse;
  
  /** Priority level */
  priority: FeedbackPriority;
  
  /** When created */
  createdAt: Date;
  
  /** When last updated */
  updatedAt: Date;
  
  /** When resolved */
  resolvedAt?: Date;
}

type FeedbackType = 
  | "clarification"
  | "question"
  | "idea"
  | "blocker"
  | "review";

type FeedbackStatus = 
  | "pending"      // Awaiting human response
  | "acknowledged" // Human has seen it
  | "resolved"     // Human has responded
  | "dismissed";   // Human dismissed without response

type FeedbackPriority = 
  | "low"
  | "medium"
  | "high"
  | "critical";
```

### Feedback Context

```typescript
interface FeedbackContext {
  /** Related file paths */
  files?: string[];
  
  /** Code snippets for reference */
  codeSnippets?: Array<{
    file: string;
    startLine: number;
    endLine: number;
    content: string;
  }>;
  
  /** Options the agent is considering */
  options?: Array<{
    label: string;
    description: string;
    recommended?: boolean;
  }>;
  
  /** Any additional structured data */
  metadata?: Record<string, unknown>;
}
```

### Feedback Response

```typescript
interface FeedbackResponse {
  /** The human's response content */
  content: string;
  
  /** If options were provided, which was selected */
  selectedOption?: string;
  
  /** Who responded */
  respondedBy: string;
  
  /** When responded */
  respondedAt: Date;
}
```

---

## Workflow Integration

### Creating Feedback

Agents create feedback via the `feedback:create` tool:

```typescript
// Example: Implementation agent needs clarification
await tools.feedback.create({
  type: "clarification",
  content: "The task mentions 'standard validation' but I found three validation patterns in the codebase. Which should I use?",
  context: {
    files: [
      "src/validation/schema.ts",
      "src/validation/runtime.ts", 
      "src/validation/zod.ts"
    ],
    options: [
      { label: "schema", description: "JSON Schema validation", recommended: false },
      { label: "runtime", description: "Runtime type checking", recommended: false },
      { label: "zod", description: "Zod schema validation", recommended: true }
    ]
  },
  priority: "medium"
});
```

### Feedback Visibility

Feedback appears in:
1. **Workflow chat** — As a special message type with response UI
2. **Workflow sidebar** — Badge count of pending feedback
3. **Dashboard** — Aggregated view of all pending feedback across workflows

### Responding to Feedback

Humans respond via:
1. **Chat interface** — Inline response in the conversation
2. **Feedback panel** — Dedicated UI for managing feedback
3. **Option selection** — Click to select from agent-provided options

### Agent Continuation

When feedback is resolved:
1. Response is added to workflow messages
2. Agent can query for resolved feedback
3. Workflow can auto-advance if feedback was blocking

---

## Feedback Lifecycle

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   pending   │────▶│ acknowledged │────▶│   resolved   │
└─────────────┘     └──────────────┘     └──────────────┘
       │                                        ▲
       │            ┌──────────────┐            │
       └───────────▶│  dismissed   │────────────┘
                    └──────────────┘
```

---

## Priority Rules

| Type | Default Priority | Can Block? |
|------|------------------|------------|
| blocker | critical | Always |
| clarification | medium | Often |
| review | medium | Sometimes |
| question | low | Rarely |
| idea | low | Never |

Agents can override default priority with justification.

---

## UI Components

### Feedback Message (in chat)

```
┌─────────────────────────────────────────────────────────┐
│ 🔶 CLARIFICATION from Implementation Agent              │
├─────────────────────────────────────────────────────────┤
│ The task mentions 'standard validation' but I found     │
│ three validation patterns in the codebase. Which        │
│ should I use?                                           │
│                                                         │
│ Related files:                                          │
│ • src/validation/schema.ts                              │
│ • src/validation/runtime.ts                             │
│ • src/validation/zod.ts                                 │
│                                                         │
│ Options:                                                │
│ ○ schema - JSON Schema validation                       │
│ ○ runtime - Runtime type checking                       │
│ ● zod - Zod schema validation (recommended)             │
│                                                         │
│ [Respond] [Dismiss]                                     │
└─────────────────────────────────────────────────────────┘
```

### Feedback Badge

Sidebar shows: `Feedback (3)` with color indicating highest priority.

### Feedback Panel

Dedicated view listing all feedback with filters:
- By status (pending, resolved, dismissed)
- By type (clarification, question, etc.)
- By workflow/chain/task
- By priority

---

## API (tRPC)

```typescript
const feedbackRouter = router({
  // Create feedback (agent action)
  create: publicProcedure
    .input(createFeedbackSchema)
    .mutation(async ({ input }) => {
      return feedbackManager.create(input);
    }),

  // List feedback with filters
  list: publicProcedure
    .input(listFeedbackSchema)
    .query(async ({ input }) => {
      return feedbackManager.list(input);
    }),

  // Get single feedback item
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return feedbackManager.get(input.id);
    }),

  // Respond to feedback (human action)
  respond: publicProcedure
    .input(respondFeedbackSchema)
    .mutation(async ({ input }) => {
      return feedbackManager.respond(input.id, input.response);
    }),

  // Dismiss feedback (human action)
  dismiss: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return feedbackManager.dismiss(input.id);
    }),

  // Acknowledge feedback (human has seen it)
  acknowledge: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return feedbackManager.acknowledge(input.id);
    }),
});
```

---

## File Structure

```
.choragen/
├── workflows/
│   └── WF-YYYYMMDD-NNN/
│       ├── workflow.json
│       └── feedback/           # Feedback items for this workflow
│           ├── FB-001.json
│           └── FB-002.json
└── ...
```

---

## Acceptance Criteria

- [ ] `FeedbackManager` provides CRUD operations for feedback items
- [ ] Agents can create feedback via `feedback:create` tool
- [ ] Feedback persists in workflow directory
- [ ] Chat interface renders feedback as interactive messages
- [ ] Humans can respond to feedback inline or via panel
- [ ] Feedback status updates propagate to agents
- [ ] Dashboard shows aggregated pending feedback count
- [ ] Blocker feedback prevents workflow advancement until resolved
- [ ] Feedback includes context (files, code snippets, options)

---

## Linked Scenarios

- [Human-Driven Development](../scenarios/human-driven-development.md)

---

## Linked Features

- [Specialized Agent Roles](./specialized-agent-roles.md)
- [Workflow Orchestration](./workflow-orchestration.md)
- [Web Chat Interface](./web-chat-interface.md)

---

## Open Questions

1. **Feedback expiration** — Should old unresolved feedback auto-dismiss?
2. **Batch responses** — Can humans respond to multiple similar feedback at once?
3. **Feedback templates** — Should agents have pre-defined feedback patterns?
4. **Notification system** — How to alert humans to high-priority feedback?
