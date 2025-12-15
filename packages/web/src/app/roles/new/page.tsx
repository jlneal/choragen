// ADR: ADR-011-web-api-architecture
"use client";

export const dynamic = "force-dynamic";

import { RoleEditor } from "@/components/roles/role-editor";

export default function NewRolePage() {
  return <RoleEditor mode="create" />;
}
