/**
 * @module categories
 * @description API client functions for budget category CRUD operations.
 * All mutating endpoints require authentication via {@link authFetch}.
 */

import type { CategoryType } from "../types/categoryType";
import { authFetch } from "./auth";


/**
 * Updates an existing category via `PATCH /api/category/:id`.
 *
 * @param data - Full category object; `_id` identifies the target document.
 * @throws {Error} If the server responds with a non-OK status.
 */
export async function updateCategory(data: CategoryType) {
    try {
        const {_id, userId, title, amount, allotment} = data;

        const res = await authFetch(`/api/category/${_id}`, {
            method: "PATCH",
            body: JSON.stringify({
                _id,
                userId,
                title,
                amount,
                allotment
            })
        })
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || "Error: Failed to update category");
        }
    } catch (err) {
        console.error(err)
    }
}

/**
 * Creates a new category via `PUT /api/category/new`.
 *
 * @param data - Category data; `_id` is ignored (server generates it).
 * @throws {Error} If the server responds with a non-OK status.
 */
export async function addCategory(data: CategoryType) {
    try {
        const {userId, title, amount, allotment} = data;

        const res = await authFetch(`/api/category/new`, {
            method: "PUT",
            body: JSON.stringify({
                userId,
                title,
                amount,
                allotment
            })
        })
        if (!res.ok) {
            const msg = await res.text();
            throw new Error(msg || "Error: Failed to create category");
        }
    } catch (err) {
        console.error(err);
    }
}

/**
 * Deletes a category (and its associated charges) via `DELETE /api/category/:id`.
 *
 * @param catId - MongoDB ObjectId string of the category to delete.
 * @throws {Error} If the server responds with a non-OK status.
 */
export async function deleteCategory(catId: string) {
    const res = await authFetch(`/api/category/${catId}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Error: Deletion failed");
    }
}
