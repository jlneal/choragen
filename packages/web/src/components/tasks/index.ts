// ADR: ADR-011-web-api-architecture

/**
 * Task components for the web dashboard
 *
 * These components are used to display task information within chain detail views.
 */

export { TaskStatusBadge, type TaskStatus } from "./task-status-badge";
export { TaskRow, type TaskRowData } from "./task-row";
export {
  TaskList,
  TaskListEmpty,
  TaskListSkeleton,
} from "./task-list";
export { TaskDetailPanel } from "./task-detail-panel";
