// ADR: ADR-011-web-api-architecture

import type { ReactNode } from "react";

export default function WorkflowsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="space-y-6">{children}</div>;
}
