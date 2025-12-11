# Feature: Web Chat Interface

**Domain**: core  
**Status**: draft  
**Created**: 2025-12-10  

---

## Overview

The Web Chat Interface is the primary human interaction point for driving Choragen workflows. Humans give high-level instructions via natural language, observe agent work in real-time, and approve stage gates—all through a chat-based UI in the web dashboard.

This replaces the need for humans to directly manipulate Choragen primitives (requests, chains, tasks) or copy handoff prompts between IDE sessions.

---

## Problem

Current interaction models require humans to:
- Create CRs/FRs manually in markdown files
- Run CLI commands to create chains and tasks
- Copy handoff prompts between agent sessions
- Monitor progress by reading task files and git logs

This creates friction:
- High ceremony for simple requests
- Context switching between chat, CLI, and file system
- No unified view of workflow progress
- Manual coordination of multi-stage work

---

## Solution

A **chat interface** in the web app that:
1. Accepts natural language instructions from humans
2. Routes messages to the appropriate workflow/session
3. Displays agent responses and status updates in real-time
4. Surfaces gate approval prompts at the right moments
5. Provides drill-down into artifacts (CRs, chains, tasks, files)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Web App (Next.js)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Chat Interface                              │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │  Message List                                            │    │   │
│  │  │  - Human messages                                        │    │   │
│  │  │  - Agent responses                                       │    │   │
│  │  │  - System notifications                                  │    │   │
│  │  │  - Gate approval prompts                                 │    │   │
│  │  │  - Artifact links (expandable)                           │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │  Input Area                                              │    │   │
│  │  │  - Text input                                            │    │   │
│  │  │  - Quick actions (approve, reject, pause)                │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│                                   │ tRPC / WebSocket                    │
│                                   ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Chat Router (tRPC)                          │   │
│  │  - workflow.sendMessage                                         │   │
│  │  - workflow.onMessage (subscription)                            │   │
│  │  - workflow.satisfyGate                                         │   │
│  │  - workflow.getHistory                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Workflow Orchestrator                            │
│  - Routes messages to active session                                    │
│  - Manages stage transitions                                            │
│  - Emits events for UI updates                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Agent Runtime                                  │
│  - Executes agent sessions                                              │
│  - Enforces governance                                                  │
│  - Returns responses to orchestrator                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## UI Components

### Chat Container

The main chat view, showing conversation history and input.

```tsx
interface ChatContainerProps {
  workflowId: string;
}

function ChatContainer({ workflowId }: ChatContainerProps) {
  const messages = trpc.workflow.getHistory.useQuery({ workflowId });
  const subscription = trpc.workflow.onMessage.useSubscription({ workflowId });
  
  return (
    <div className="flex flex-col h-full">
      <ChatHeader workflowId={workflowId} />
      <MessageList messages={messages.data} />
      <ChatInput workflowId={workflowId} />
    </div>
  );
}
```

### Message Types

Different message types render differently:

| Type | Appearance | Actions |
|------|------------|---------|
| `human` | Right-aligned, user bubble | None |
| `control` | Left-aligned, agent bubble | None |
| `impl` | Left-aligned, nested agent bubble | None |
| `system` | Centered, muted text | None |
| `gate_prompt` | Card with approve/reject buttons | Approve, Reject |
| `artifact` | Expandable card with preview | View, Edit |
| `tool_call` | Collapsible detail view | Expand |
| `error` | Red alert banner | Retry, Dismiss |

### Gate Prompt

When a stage gate requires human approval:

```tsx
interface GatePromptProps {
  workflowId: string;
  stageIndex: number;
  prompt: string;
}

function GatePrompt({ workflowId, stageIndex, prompt }: GatePromptProps) {
  const satisfyGate = trpc.workflow.satisfyGate.useMutation();
  
  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle>Approval Required</CardTitle>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardFooter className="gap-2">
        <Button 
          onClick={() => satisfyGate.mutate({ workflowId, stageIndex, approved: true })}
        >
          Approve
        </Button>
        <Button 
          variant="outline"
          onClick={() => satisfyGate.mutate({ workflowId, stageIndex, approved: false })}
        >
          Request Changes
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Artifact Link

When an agent creates or references an artifact:

```tsx
interface ArtifactLinkProps {
  type: "cr" | "chain" | "task" | "file" | "adr";
  id: string;
  title: string;
}

function ArtifactLink({ type, id, title }: ArtifactLinkProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="border rounded p-2">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2">
        <ArtifactIcon type={type} />
        <span className="font-mono text-sm">{id}</span>
        <span className="text-muted-foreground">{title}</span>
        <ChevronDown className={expanded ? "rotate-180" : ""} />
      </button>
      {expanded && <ArtifactPreview type={type} id={id} />}
    </div>
  );
}
```

### Workflow Sidebar

Shows current workflow state alongside chat:

```tsx
function WorkflowSidebar({ workflowId }: { workflowId: string }) {
  const workflow = trpc.workflow.get.useQuery({ id: workflowId });
  
  return (
    <aside className="w-64 border-l p-4">
      <h3 className="font-semibold">Workflow Progress</h3>
      <StageList stages={workflow.data?.stages} currentStage={workflow.data?.currentStage} />
      
      <h3 className="font-semibold mt-4">Artifacts</h3>
      <ArtifactList workflowId={workflowId} />
      
      <h3 className="font-semibold mt-4">Metrics</h3>
      <WorkflowMetrics workflowId={workflowId} />
    </aside>
  );
}
```

---

## Real-Time Updates

The chat uses tRPC subscriptions for real-time message streaming:

```typescript
// Server-side: emit messages as they arrive
workflowRouter.onMessage = publicProcedure
  .input(z.object({ workflowId: z.string() }))
  .subscription(async function* ({ input }) {
    const workflow = await getWorkflow(input.workflowId);
    
    // Yield existing messages
    for (const message of workflow.messages) {
      yield message;
    }
    
    // Subscribe to new messages
    for await (const message of messageStream(input.workflowId)) {
      yield message;
    }
  });

// Client-side: consume stream
const subscription = trpc.workflow.onMessage.useSubscription(
  { workflowId },
  {
    onData: (message) => {
      setMessages((prev) => [...prev, message]);
    },
  }
);
```

---

## Conversation Modes

### New Workflow

When no workflow is active, the chat starts fresh:

```
┌─────────────────────────────────────────────────────────────────┐
│  💬 Start a new workflow                                        │
│                                                                 │
│  Describe what you'd like to accomplish:                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Add pagination to the backlog view...                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Or select from backlog:                                        │
│  • CR-20251210-001: Web Request Creation                        │
│  • CR-20251210-002: Web Chain Creation                          │
│  • CR-20251210-003: Web Task Creation                           │
└─────────────────────────────────────────────────────────────────┘
```

### Active Workflow

When a workflow is in progress:

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 CR-20251210-004: Backlog Pagination                         │
│  Stage: Design (2/5) • Active                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [You] Add pagination to the backlog view                       │
│                                                                 │
│  [Control] I've created CR-20251210-004 for backlog pagination. │
│  📄 CR-20251210-004-backlog-pagination.md                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ✋ Approval Required                                     │   │
│  │ CR created. Proceed to design?                          │   │
│  │ [Approve] [Request Changes]                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [You] Yes, go ahead                                            │
│                                                                 │
│  [Control] Starting design phase...                             │
│  🔗 Created CHAIN-051-backlog-pagination-design                 │
│                                                                 │
│  [Control] Working on design tasks...                           │
│  > task:add CHAIN-051 define-ux "Define pagination UX"          │
│  > task:add CHAIN-051 document-api "Document API changes"       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Workflow List

View and switch between workflows:

```
┌─────────────────────────────────────────────────────────────────┐
│  Active Workflows                                               │
├─────────────────────────────────────────────────────────────────┤
│  ● CR-20251210-004: Backlog Pagination                          │
│    Stage: Implementation (3/5) • Running                        │
│                                                                 │
│  ○ CR-20251210-003: Web Task Creation                           │
│    Stage: Design (2/5) • Awaiting Approval                      │
│                                                                 │
│  ✓ CR-20251209-001: Session Monitoring                          │
│    Completed 2 hours ago                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Navigation

The chat interface integrates with the existing web app:

| Route | Purpose |
|-------|---------|
| `/chat` | Main chat view, shows active workflow or start new |
| `/chat/[workflowId]` | Specific workflow conversation |
| `/chat/history` | List of all workflows (active and completed) |
| `/workflows` | Redirect to `/chat` (alias) |

Existing pages link to chat:
- Session cards → "Open in Chat"
- Chain cards → "View Workflow"
- Request cards → "Start Workflow"

---

## Acceptance Criteria

- [ ] Chat interface renders message history
- [ ] Human can send messages to active workflow
- [ ] Agent responses appear in real-time
- [ ] Gate prompts display with approve/reject actions
- [ ] Artifacts are linked and expandable
- [ ] Tool calls are visible (collapsible)
- [ ] Workflow sidebar shows current stage and progress
- [ ] Can switch between active workflows
- [ ] Can start new workflow from chat
- [ ] Can start workflow from existing backlog CR
- [ ] Mobile-responsive layout

---

## Linked Scenarios

- [Human-Driven Development](../scenarios/human-driven-development.md)

---

## Linked Features

- [Workflow Orchestration](./workflow-orchestration.md)
- [Agent Runtime](./agent-runtime.md)

---

## Linked ADRs

- ADR-011: Web API Architecture
- ADR-TBD: Chat Interface Design

---

## Open Questions

1. **Typing indicators** — Show when agent is "thinking"?
2. **Message editing** — Can humans edit/delete their messages?
3. **Branching conversations** — Can human ask clarifying questions mid-stage?
4. **Notifications** — Alert when gate needs approval (if user navigates away)?
5. **Mobile experience** — Full chat on mobile or simplified view?
