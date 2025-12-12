# Task: Tool Call Display

**Chain**: CHAIN-066-agent-invocation-web  
**Task ID**: 006  
**Type**: impl  
**Status**: done  
**Depends On**: 004

---

## Objective

Display agent tool calls in the chat UI with collapsible details showing the tool name, arguments, and results.

---

## Acceptance Criteria

- [ ] Tool calls displayed inline in agent messages
- [ ] Shows tool name and status (pending/success/error)
- [ ] Collapsible section for arguments and results
- [ ] Visual distinction from regular message content
- [ ] Multiple tool calls in sequence displayed correctly

---

## Implementation Notes

**File**: `packages/web/src/components/chat/tool-call-display.tsx`

```tsx
interface ToolCallDisplayProps {
  toolCall: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
    status: "pending" | "success" | "error";
  };
}

export function ToolCallDisplay({ toolCall }: ToolCallDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="border rounded-md p-2 my-2 bg-muted/50">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2">
        <ChevronRight className={cn("transition-transform", expanded && "rotate-90")} />
        <code className="text-sm">{toolCall.name}</code>
        <StatusBadge status={toolCall.status} />
      </button>
      {expanded && (
        <div className="mt-2 text-xs">
          <pre>{JSON.stringify(toolCall.arguments, null, 2)}</pre>
          {toolCall.result && <pre>{JSON.stringify(toolCall.result, null, 2)}</pre>}
        </div>
      )}
    </div>
  );
}
```

---

## Verification

```bash
pnpm --filter @choragen/web dev
# Trigger agent that uses tools
# Verify tool calls display with expand/collapse
```
