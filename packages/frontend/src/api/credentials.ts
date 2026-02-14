/**
 * @module credentials
 * @description API client functions for authentication: login, registration,
 * and credential-to-user ID resolution. Login and register are public endpoints;
 * {@link getUserId} requires a valid JWT.
 */

import { getAuthHeaders } from "./auth";


/** Initial budget data submitted during user registration. */
interface UserData {
    /** Starting total amount (typically 0). */
    totalAmount: number;
    /** Initial budget allotment. */
    totalAllotment: number;
}

/**
 * Authenticates a user via `POST /api/public/login`.
 *
 * @param username - The user's username.
 * @param password - The user's plain-text password.
 * @returns An object containing `{ token }` on success, or `undefined` on failure.
 */
export async function login(username: string, password: string) {
    try {
        const res = await fetch(`/api/public/login`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                username,
                password
            })
        })
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || "Error: Unable to verify credentials")
        }
        return res.json(); // { token: ...}
    } catch (err) {
        console.error(err);
    }
}

/**
 * Registers a new user via `POST /api/public/register`.
 *
 * @param username - Desired username (must be unique).
 * @param email - User's email address.
 * @param plainTextPassword - Password in plain text (hashed server-side).
 * @param userData - Initial budget figures (totalAmount, totalAllotment).
 * @returns The parsed JSON response on success, or `undefined` on failure.
 */
export async function register(
    username: string,
    email: string,
    plainTextPassword: string,
    userData: UserData
) {
    try {
        const res = await fetch(`/api/public/register`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                username,
                email,
                plainTextPassword,
                userData
            })
        })
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || "Error: Unable to verify credentials")
        }
        return res.json(); // { token: ...}
    } catch (err) {
        console.error(err);
    }
}

/**
 * Resolves the authenticated user's credential to their user document ID
 * via `GET /api/auth/userId`. Requires a valid JWT in localStorage.
 *
 * @returns The user's MongoDB ObjectId string, or `undefined` on failure.
 */
export async function getUserId() {
    try {
        const res = await fetch(`/api/auth/userId`, {
            method: "GET",
            headers: getAuthHeaders(),
        })
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || "Error: Unable to verify credentials")
        }

        const { userId } = await res.json();
        return userId;
    } catch (err) {
        console.error(err);
    }
}
