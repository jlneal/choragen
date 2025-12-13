// ADR: ADR-001-task-file-format

/**
 * Workflow event type definitions.
 *
 * These mirror lifecycle events emitted by task, chain, and request review flows.
 */

import type { TaskSubmittedEvent } from "../task/submit.js";
import type {
  TaskApprovedEvent,
  TaskChangesRequestedEvent,
} from "../task/review.js";
import type {
  ChainApprovedEvent,
  ChainChangesRequestedEvent,
} from "../chain/review.js";
import type {
  RequestApprovedEvent,
  RequestChangesRequestedEvent,
} from "../request/review.js";

export type WorkflowEventMap = {
  "task:submitted": TaskSubmittedEvent;
  "task:approved": TaskApprovedEvent;
  "task:changes_requested": TaskChangesRequestedEvent;
  "chain:approved": ChainApprovedEvent;
  "chain:changes_requested": ChainChangesRequestedEvent;
  "request:approved": RequestApprovedEvent;
  "request:changes_requested": RequestChangesRequestedEvent;
};

export type WorkflowEventType = keyof WorkflowEventMap;

export type WorkflowEvent<T extends WorkflowEventType = WorkflowEventType> = {
  type: T;
  payload: WorkflowEventMap[T];
};
