// ADR: ADR-011-web-api-architecture

/**
 * Request components for the web dashboard
 *
 * These components are used to display request (CR/FR) information in list and detail views.
 */

// List view components
export { RequestCard } from "./request-card";
export { RequestStatusBadge, type RequestStatus } from "./request-status-badge";
export { RequestTypeBadge, type RequestType } from "./request-type-badge";
export { RequestTabs, type RequestTab } from "./request-tabs";
export { RequestFilters, type RequestFilterState } from "./request-filters";
export { RequestSort, type RequestSortState, type RequestSortField, type SortDirection } from "./request-sort";
export { RequestList, RequestCardSkeleton, RequestListLoading, RequestListNoRequests } from "./request-list";

// Backlog components
export { BacklogList, BacklogListLoading, BacklogListNoRequests } from "./backlog-list";
export { BacklogCount } from "./backlog-count";

// Detail view components
export { RequestHeader, RequestHeaderSkeleton } from "./request-header";
export { AcceptanceCriteriaList, AcceptanceCriteriaListSkeleton } from "./acceptance-criteria-list";
export { RequestContent, RequestContentSkeleton } from "./request-content";
export { LinkedChains, LinkedChainsSkeleton } from "./linked-chains";

// Form components
export { RequestForm } from "./request-form";

// Action components
export { RequestActions } from "./request-actions";
