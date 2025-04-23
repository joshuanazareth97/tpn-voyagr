/**
 * Converts a number of bytes into a human-readable string with appropriate unit.
 *
 * @param bytes - The size in bytes.
 * @param decimals - Number of decimals to include (defaults to 2).
 * @returns Formatted string, e.g. "4.50 KB", "1.02 MB".
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

  return `${value} ${sizes[i]}`;
}
