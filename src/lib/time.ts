/**
 * Format a timestamp as a relative-time string ("just now", "5m ago", "2h ago").
 * Returns "never" for null/undefined timestamps.
 *
 * Rendering is computed at call time — callers should re-render when they
 * want a fresh string (e.g. after data updates). For most screens that
 * happens naturally because syncedAt itself changes after each refresh.
 */
export function timeAgo(timestamp: number | null | undefined, now: number = Date.now()): string {
  if (timestamp == null) return 'never';
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (diffSec < 30) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}
