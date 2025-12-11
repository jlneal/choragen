// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/web-chat-interface.md

import type { ReactNode } from "react";

/**
 * Next.js App Router layout for chat routes.
 * Simply passes children through - the ChatPageWrapper component handles the header.
 */
export default function ChatLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
