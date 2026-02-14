/**
 * @module auth
 * @description Utility for constructing authenticated HTTP request headers
 * and a fetch wrapper that automatically handles expired JWT tokens.
 *
 * When any authenticated API call receives a 401 response, {@link authFetch}
 * clears the stored token and dispatches an `"auth:expired"` event on `window`.
 * The root {@link App} component listens for this event to redirect to login.
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

/**
 * Clears stored auth state and dispatches a window event so the App
 * component can react and redirect to the login page.
 */
function handleExpiredToken() {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth:expired"));
}

/**
 * Authenticated fetch wrapper. Automatically attaches JWT headers and
 * intercepts 401 responses to trigger a logout + redirect to login.
 *
 * @param url - The request URL.
 * @param options - Standard `RequestInit` options (method, body, etc.).
 *                  `Authorization` and `Content-Type` headers are set automatically.
 * @returns The fetch {@link Response} if the status is not 401.
 * @throws {Error} Rethrows non-401 network or fetch errors.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const res = await fetch(url, {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...(options.headers || {}),
        },
    });

    if (res.status === 401) {
        handleExpiredToken();
        throw new Error("Session expired");
    }

    return res;
}
