/**
 * @module useSlugtify
 * @description Utility function that converts a human-readable string into a
 * URL-friendly slug. Trims whitespace, lowercases, replaces non-alphanumeric
 * characters with hyphens, and strips leading/trailing hyphens.
 */

/**
 * Converts a display name into a URL-safe slug.
 *
 * @param name - The raw string to slugify (e.g., "My Category!").
 * @returns A lowercase, hyphen-separated slug (e.g., "my-category").
 *
 * @example
 * useSlugtify("  Hello World! ")  // "hello-world"
 * useSlugtify("Groceries & Food") // "groceries-food"
 */
function useSlugtify(name: string): string {
    return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default useSlugtify;
