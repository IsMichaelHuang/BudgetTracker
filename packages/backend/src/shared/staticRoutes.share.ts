/**
 * @module staticRoutes.share
 * @description Canonical API route prefixes used throughout the backend.
 * Centralizing these constants ensures consistency between route registration,
 * middleware configuration, and client-side API calls.
 */

/**
 * Map of all valid route prefixes for the BudgetTracker API.
 * Keys are logical group names; values are the corresponding URL path prefixes.
 */
export const ValidStaticRoutes = {
    /** Application root path. */
    START: "/",
    /** Unauthenticated public endpoints (login, register). */
    PUBLIC: "/api/public/",

    /** Authentication-related endpoints (token lookup). */
    AUTH: "/api/auth/",
    /** User profile and summary endpoints. */
    USER: "/api/user/",
    /** Charge (expense/transaction) CRUD endpoints. */
    CHARGE: "/api/charge/",
    /** Budget category CRUD endpoints. */
    CATEGORY: "/api/category/"
}
