// ADR: ADR-011-web-api-architecture
// Design doc: docs/design/core/features/agent-feedback.md
// Utility to scroll to feedback section in the chat or panel.

export function scrollToFeedbackSection(): void {
  if (typeof window === "undefined") return;
  const target = document.getElementById("feedback-section");
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
