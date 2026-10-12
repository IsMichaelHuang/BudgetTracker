/**
 * Helpers shared by integration tests: a direct pool for setup and
 * assertions, table reset, and a register-and-login shortcut.
 */
import { pool } from "../postgres.database";
import request from "supertest";
import app from "../app";

export { pool };

export const api = () => request(app);

export async function resetTables(): Promise<void> {
    await pool.query(
        "TRUNCATE networth, charges, categories, user_credentials, users"
    );
}

export interface TestUser {
    username: string;
    token: string;
    userId: string;
    auth: { Authorization: string };
}

export async function signUp(username: string): Promise<TestUser> {
    const password = "password123";
    const reg = await api().post("/api/public/register").send({
        username,
        email: `${username}@example.com`,
        plainTextPassword: password,
        userData: { totalAmount: 0, totalAllotment: 500 },
    });
    if (reg.status !== 200) throw new Error(`register ${reg.status}`);
    const login = await api()
        .post("/api/public/login")
        .send({ username, password });
    const token: string = login.body.token;
    const auth = { Authorization: `Bearer ${token}` };
    const me = await api().get("/api/auth/userId").set(auth);
    return { username, token, userId: me.body.userId, auth };
}
