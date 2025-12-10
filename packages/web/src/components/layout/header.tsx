// ADR: ADR-011-web-api-architecture
"use client";

import { MobileSidebar } from "@/components/layout/sidebar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProjectSelector } from "@/components/project";
import { GitStatus } from "@/components/git/git-status";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <MobileSidebar />
      <div className="flex-1">
        <Breadcrumbs />
      </div>
      <div className="flex items-center gap-3">
        <ProjectSelector />
        <GitStatus />
        <ThemeToggle />
      </div>
    </header>
  );
}
