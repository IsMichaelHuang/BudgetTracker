/**
 * @module charges
 * @description API client functions for charge (expense) CRUD operations.
 * All endpoints require authentication via {@link authFetch}.
 */

import type { ChargeType } from "../types/chargeType";
import { authFetch } from "./auth";


/**
 * Updates an existing charge via `PATCH /api/charge/:id`.
 *
 * @param data - Full charge object; `_id` identifies the target document.
 * @throws {Error} If the server responds with a non-OK status.
 */
export async function updateCharge(data: ChargeType) {
    try {
        const {_id, userId, categoryId, description, amount, date} = data;

        const res = await authFetch(`/api/charge/${_id}`, {
            method: "PATCH",
            body: JSON.stringify({
                _id,
                userId,
                categoryId,
                description,
                amount,
                date
            })
        })
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || "Error: updating charge");
        }
    } catch (err) {
        console.error(err);
    }
}

/**
 * Creates a new charge via `PUT /api/charge/new`.
 *
 * @param data - Charge data; `_id` is ignored (server generates it).
 * @throws {Error} If the server responds with a non-OK status.
 */
export async function addCharge(data: ChargeType) {
    try {
        const {userId, categoryId, description, amount, date} = data;

        const res = await authFetch(`/api/charge/new`, {
            method: "PUT",
            body: JSON.stringify({
                userId,
                categoryId,
                description,
                amount,
                date
            })
        })
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || "Error: create charge failed");
        }
    } catch (err) {
        console.error(err);
    }
}

/**
 * Deletes a charge via `DELETE /api/charge/:id`.
 *
 * @param chargeId - MongoDB ObjectId string of the charge to delete.
 * @returns `true` if the deletion succeeded.
 * @throws {Error} If the server responds with a non-OK status.
 */
export async function deleteCharge(chargeId: string): Promise<boolean> {
    const res = await authFetch(`/api/charge/${chargeId}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Error: Deletion failed");
    }
    return true;
}
