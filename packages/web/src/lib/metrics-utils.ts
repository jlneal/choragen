// ADR: ADR-011-web-api-architecture

/**
 * Utility functions for formatting metrics values
 */

/**
 * Format milliseconds to a human-readable duration string.
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted string (e.g., "2.5h", "45m", "30s")
 */
export function formatDuration(ms: number): string {
  if (ms === 0) return "—";

  const seconds = ms / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;

  if (hours >= 1) {
    return `${hours.toFixed(1)}h`;
  }
  if (minutes >= 1) {
    return `${Math.round(minutes)}m`;
  }
  return `${Math.round(seconds)}s`;
}

/**
 * Format a rate (0-1) as a percentage string.
 *
 * @param rate - Rate value between 0 and 1
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "85.5%")
 */
export function formatPercentage(rate: number, decimals = 1): string {
  if (rate === 0) return "0%";
  return `${(rate * 100).toFixed(decimals)}%`;
}

/**
 * Format a number with appropriate suffixes for large values.
 *
 * @param value - Numeric value
 * @returns Formatted string (e.g., "1.2K", "3.5M")
 */
export function formatNumber(value: number): string {
  if (value === 0) return "0";

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Format token count with appropriate suffix.
 *
 * @param tokens - Number of tokens
 * @returns Formatted string (e.g., "1.2K", "500")
 */
export function formatTokens(tokens: number): string {
  return formatNumber(tokens);
}

/**
 * Format a cost value as currency.
 *
 * @param cost - Cost in dollars
 * @returns Formatted currency string (e.g., "$12.50")
 */
export function formatCost(cost: number): string {
  if (cost === 0) return "$0.00";
  return `$${cost.toFixed(2)}`;
}

/**
 * Calculate trend direction based on current and previous values.
 * Lower is better for metrics like rework rate.
 *
 * @param current - Current value
 * @param previous - Previous value
 * @param lowerIsBetter - Whether a lower value is considered better
 * @returns Trend direction: "up", "down", or "neutral"
 */
export function getTrendDirection(
  current: number,
  previous: number,
  lowerIsBetter = false
): "up" | "down" | "neutral" {
  if (current === previous) return "neutral";

  const isIncreasing = current > previous;

  if (lowerIsBetter) {
    return isIncreasing ? "down" : "up";
  }
  return isIncreasing ? "up" : "down";
}

/**
 * Calculate percentage change between two values.
 *
 * @param current - Current value
 * @param previous - Previous value
 * @returns Percentage change (can be negative)
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}
