// ADR: ADR-011-web-api-architecture

/**
 * Group components for the web dashboard
 *
 * These components are used to display and manage request groups.
 */

export { GroupCard, GroupCardSkeleton } from "./group-card";
export { GroupHeader } from "./group-header";
export { GroupActions, CreateGroupButton } from "./group-actions";
export { RequestGroupBadge } from "./request-group-badge";
export {
  CollisionDialog,
  type Collision,
  type CollisionStrategy,
  type ManualSelection,
} from "./collision-dialog";
