import type { ChargeType } from "../types/chargeType";
import { getAuthHeaders } from "./auth";


export async function updateCharge(data: ChargeType) {
    try { 
        const {_id, userId, categoryId, description, amount, date} = data;

        const res = await fetch(`/api/charge/${_id}`, {
            method: "PATCH",
            headers: getAuthHeaders(),
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

export async function addCharge(data: ChargeType) {
    try {
        const {userId, categoryId, description, amount, date} = data; 

        const res = await fetch(`/api/charge/new`, {
            method: "PUT",
            headers: getAuthHeaders(),
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

export async function deleteCharge(chargeId: string): Promise<boolean> {
    const res = await fetch(`/api/charge/${chargeId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Error: Deletion failed");
    }      
    return true;
}

