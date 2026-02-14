/**
 * @module auth
 * @description Utility for constructing authenticated HTTP request headers.
 * Reads the JWT from `localStorage` and returns headers suitable for
 * protected API calls.
 */

/**
 * Builds an HTTP headers object with the stored JWT Bearer token.
 *
 * @returns An object containing `Content-Type` and `Authorization` headers.
 * @throws {Error} If no token is found in `localStorage`.
 */
export function getAuthHeaders() {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Missing Token");
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
    };
}
