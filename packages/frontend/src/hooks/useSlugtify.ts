/**
 * @module useSlugtify
 * @description Pure helpers that convert a human-readable string into a
 * URL-friendly slug. Not a hook, so they can be called inside `.map`.
 */

/**
 * Lowercases, replaces runs of non-alphanumerics with a hyphen, and strips
 * leading/trailing hyphens. May return "" (e.g. for non-Latin input).
 *
 * @example
 * slugify("  Hello World! ")  // "hello-world"
 */
export function slugify(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

/** Username path segment; never empty and never the reserved "net-worth". */
export function userSlug(name: string): string {
    const slug = slugify(name);
    return slug && slug !== "net-worth" ? slug : "user";
}

/** Category path segment; never empty. */
export function categorySlug(title: string): string {
    return slugify(title) || "category";
}
