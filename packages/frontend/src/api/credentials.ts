import { getAuthHeaders } from "./auth";


interface UserData {
    totalAmount: number;
    totalAllotment: number;
}

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

