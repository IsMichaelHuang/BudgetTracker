import type { CategoryType } from "../types/categoryType";
import { getAuthHeaders } from "./auth";


export async function updateCategory(data: CategoryType) { 
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Missing Token");
    try {
        const {_id, userId, title, amount, allotment} = data;

        const res = await fetch(`/api/category/${_id}`, {
            method: "PATCH",
            headers: getAuthHeaders(), 
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

export async function addCategory(data: CategoryType) {
    try {
        const {userId, title, amount, allotment} = data;

        const res = await fetch(`/api/category/new`, {
            method: "PUT",
            headers: getAuthHeaders(),
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

export async function deleteCategory(catId: string) { 
    const res = await fetch(`/api/category/${catId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Error: Deletion failed");
    }
}

