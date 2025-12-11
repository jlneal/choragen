// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md

const DEFAULT_TIMESTAMP_MS = 0;

/**
 * Pick the most recently updated workflow from a list.
 * Accepts flexible date values to account for both Date objects and ISO strings.
 */
export function selectPrimaryWorkflow<T extends { updatedAt?: Date | string }>(
  workflows: T[]
): T | null {
  if (workflows.length === 0) {
    return null;
  }

  const sorted = [...workflows].sort((a, b) => {
    const aTime =
      a.updatedAt instanceof Date
        ? a.updatedAt.getTime()
        : new Date(a.updatedAt ?? DEFAULT_TIMESTAMP_MS).getTime();
    const bTime =
      b.updatedAt instanceof Date
        ? b.updatedAt.getTime()
        : new Date(b.updatedAt ?? DEFAULT_TIMESTAMP_MS).getTime();

    return bTime - aTime;
  });

  return sorted[0];
}

/**
 * Format a timestamp for display.
 */
export function formatUpdatedAt(updatedAt?: Date | string): string {
  const parsedDate =
    updatedAt instanceof Date
      ? updatedAt
      : updatedAt
        ? new Date(updatedAt)
        : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return "Updated recently";
  }

  return `Updated ${parsedDate.toLocaleString()}`;
}
