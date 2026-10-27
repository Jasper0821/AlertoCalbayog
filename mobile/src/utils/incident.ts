/** Same reference the dispatch dashboards show, so residents and responders can quote it. */
export function incidentId(reportId: string, createdAt?: string): string {
  const date = createdAt ? new Date(createdAt) : new Date();
  const year = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  return `INC-${year}-${reportId.slice(-6).toUpperCase()}`;
}

/** Non-breaking hyphens for display, so "INC-2026-00C3D4" never splits across lines. */
export function unbroken(text: string): string {
  return text.replace(/-/g, "‑");
}

/** "Just now", "7m ago", "3h ago", "2d ago", then a short date. */
export function relativeTime(dateString: string): string {
  const date = new Date(dateString);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
