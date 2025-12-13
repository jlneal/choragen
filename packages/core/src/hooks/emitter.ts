// ADR: ADR-001-task-file-format

/**
 * Typed workflow event emitter.
 */

import type { WorkflowEvent, WorkflowEventType, WorkflowEventMap } from "./events.js";

export type WorkflowEventHandler<T extends WorkflowEventType> = (
  event: WorkflowEvent<T>
) => Promise<void> | void;

type AnyHandler = (event: WorkflowEvent<WorkflowEventType>) => Promise<void> | void;

export class WorkflowEventEmitter {
  private handlers: Map<WorkflowEventType, AnyHandler[]> = new Map();

  on<T extends WorkflowEventType>(
    type: T,
    handler: WorkflowEventHandler<T>
  ): void {
    const existing = this.handlers.get(type) || [];
    existing.push(handler as AnyHandler);
    this.handlers.set(type, existing);
  }

  async emit<T extends WorkflowEventType>(
    type: T,
    payload: WorkflowEventMap[T]
  ): Promise<void> {
    const event: WorkflowEvent<T> = { type, payload };
    const handlers = this.handlers.get(type) || [];
    for (const handler of handlers) {
      await handler(event);
    }
  }
}
