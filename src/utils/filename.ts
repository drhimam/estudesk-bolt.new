/**
 * Utility to generate clean, consistent, cross-platform date and time stamps for export file names.
 * Format: YYYY-MM-DD_HH-mm (e.g., 2026-09-10_16-05)
 */
export function getFileTimestamp(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}-${minutes}`;
}

/**
 * Sanitize a string to be safely used in a filename across all OSes (Windows, Mac, Linux).
 */
export function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[^a-z0-9-_ ]/gi, '')
      .trim()
      .replace(/\s+/g, '_')
      .toLowerCase() || 'export'
  );
}
