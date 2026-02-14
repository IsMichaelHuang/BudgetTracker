/**
 * @module networth
 * @description API client functions for net worth CRUD operations.
 * All endpoints require authentication via {@link authFetch}.
 */

import type { NetWorthType } from "../types/netWorthType";
import { authFetch } from "./auth";

/**
 * Retrieves all net worth entries for a given user via `GET /api/networth/:userId`.
 *
 * @param userId - MongoDB ObjectId string of the user.
 * @returns Array of net worth entries.
 * @throws {Error} If the server responds with a non-OK status.
 */
export async function getNetWorth(userId: string): Promise<NetWorthType[]> {
    try {
        const res = await authFetch(`/api/networth/${userId}`, {
            method: "GET",
        });
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || "Error: fetching net worth");
        }
        return await res.json();
    } catch (err) {
        console.error(err);
        return [];
    }
}

/**
 * Creates a new net worth entry via `PUT /api/networth/new`.
 *
 * @param data - Net worth data; `_id` is ignored (server generates it).
 * @throws {Error} If the server responds with a non-OK status.
 */
export async function addNetWorth(data: NetWorthType) {
    try {
        const { userId, name, type, value, description, date } = data;

        const res = await authFetch(`/api/networth/new`, {
            method: "PUT",
            body: JSON.stringify({
                userId,
                name,
                type,
                value,
                description,
                date
            })
        });
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || "Error: create net worth failed");
        }
    } catch (err) {
        console.error(err);
    }
}

/**
 * Updates an existing net worth entry via `PATCH /api/networth/:id`.
 *
 * @param data - Full net worth object; `_id` identifies the target document.
 * @throws {Error} If the server responds with a non-OK status.
 */
export async function updateNetWorth(data: NetWorthType) {
    try {
        const { _id, userId, name, type, value, description, date } = data;

        const res = await authFetch(`/api/networth/${_id}`, {
            method: "PATCH",
            body: JSON.stringify({
                _id,
                userId,
                name,
                type,
                value,
                description,
                date
            })
        });
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || "Error: updating net worth");
        }
    } catch (err) {
        console.error(err);
    }
}

/**
 * Deletes a net worth entry via `DELETE /api/networth/:id`.
 *
 * @param id - MongoDB ObjectId string of the entry to delete.
 * @returns `true` if the deletion succeeded.
 * @throws {Error} If the server responds with a non-OK status.
 */
export async function deleteNetWorth(id: string): Promise<boolean> {
    const res = await authFetch(`/api/networth/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Error: Deletion failed");
    }
    return true;
}
