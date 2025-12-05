/**
 * Shared formatting utilities
 */

/**
 * Format a date for display with month, day, hour, and minute
 * @param date - Date to format, or null/undefined
 * @returns Formatted date string or "N/A" if no date provided
 */
export function formatDate(date: Date | null | undefined): string {
  if (!date) {
    return "N/A";
  }
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
