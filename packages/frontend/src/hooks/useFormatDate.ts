/**
 * @module useFormatDate
 * @description Utility function that normalizes date strings into the `YYYY-MM-DD`
 * format expected by HTML `<input type="date">` elements and the backend API.
 */

/**
 * Converts a date string into `YYYY-MM-DD` format.
 *
 * - Returns an empty string if the input is `undefined` or unparseable.
 * - Returns the input as-is if it already matches `YYYY-MM-DD`.
 * - Otherwise parses via `new Date()` and extracts the ISO date portion.
 *
 * @param dateString - Raw date string from the API or user input.
 * @returns A `YYYY-MM-DD` formatted string, or `""` on invalid input.
 */
export function formatToDate(dateString?: string) {
    if (!dateString) return ""

    // Regex if the string already matches YYYY-MM-DD
    if (/^d{4}-\d{2}$/.test(dateString)) return dateString

    // Covert the data object to YYYY-MM-DD
    try {
        return new Date(dateString).toISOString().slice(0, 10)
    } catch {
        return ""
    }
}
