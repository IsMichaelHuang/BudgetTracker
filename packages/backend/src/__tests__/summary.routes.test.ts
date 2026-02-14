import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

const mocks = vi.hoisted(() => {
    const clientQuery = vi.fn();
    const clientRelease = vi.fn();
    const poolQuery = vi.fn();
    const connect = vi.fn().mockResolvedValue({
        query: clientQuery,
        release: clientRelease,
    });
    return { clientQuery, clientRelease, poolQuery, connect };
});

vi.mock("../postgres.database", () => ({
    pool: {
        query: mocks.poolQuery,
        connect: mocks.connect,
    },
    connectPostgres: vi.fn(),
    closePostgres: vi.fn(),
}));

vi.mock("bcrypt", () => {
    const mock = {
        genSalt: vi.fn().mockResolvedValue("$2b$10$testsalt"),
        hash: vi.fn().mockResolvedValue("$2b$10$hashedpassword"),
        compare: vi.fn().mockResolvedValue(true),
    };
    return { ...mock, default: mock };
});

import request from "supertest";
import app from "../app";
import jwt from "jsonwebtoken";

function authToken() {
    return jwt.sign(
        { id: crypto.randomUUID(), username: "testuser" },
        process.env.JWT_SECRET!,
        { expiresIn: "2h" }
    );
}

describe("Summary Routes", () => {
    beforeEach(() => {
        mocks.clientQuery.mockReset();
        mocks.clientRelease.mockReset();
        mocks.poolQuery.mockReset();
        mocks.connect.mockResolvedValue({
            query: mocks.clientQuery,
            release: mocks.clientRelease,
        });
    });

    describe("GET /api/user/:id", () => {
        it("returns full summary with user, categories, and charges", async () => {
            const userId = crypto.randomUUID();
            const credId = crypto.randomUUID();
            const catId1 = crypto.randomUUID();
            const catId2 = crypto.randomUUID();
            const chargeId1 = crypto.randomUUID();
            const chargeId2 = crypto.randomUUID();

            // client.query calls in order:
            // 1. BEGIN
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            // 2. UPDATE categories SET amount = ...
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 2 });
            // 3. UPDATE users SET total_amount = ...
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
            // 4. SELECT * FROM users WHERE id = $1
            mocks.clientQuery.mockResolvedValueOnce({
                rows: [{
                    id: userId,
                    name: "testuser",
                    total_amount: 200,
                    total_allotment: 550,
                }],
                rowCount: 1,
            });
            // 5. SELECT * FROM categories WHERE user_id = $1
            mocks.clientQuery.mockResolvedValueOnce({
                rows: [
                    { id: catId1, user_id: userId, title: "Food", amount: 150, allotment: 400 },
                    { id: catId2, user_id: userId, title: "Gas", amount: 50, allotment: 150 },
                ],
                rowCount: 2,
            });
            // 6. SELECT * FROM charges WHERE user_id = $1
            mocks.clientQuery.mockResolvedValueOnce({
                rows: [
                    { id: chargeId1, user_id: userId, category_id: catId1, description: "Groceries", amount: 150, date: new Date().toISOString() },
                    { id: chargeId2, user_id: userId, category_id: catId2, description: "Gas fill", amount: 50, date: new Date().toISOString() },
                ],
                rowCount: 2,
            });
            // 7. COMMIT
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

            // pool.query for credential lookup
            mocks.poolQuery.mockResolvedValueOnce({
                rows: [{ id: credId }],
                rowCount: 1,
            });

            const res = await request(app)
                .get(`/api/user/${userId}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.user).toBeDefined();
            expect(res.body.user.name).toBe("testuser");
            expect(res.body.categories).toHaveLength(2);
            expect(res.body.charges).toHaveLength(2);
        });

        it("updates category amounts and user total in transaction", async () => {
            const userId = crypto.randomUUID();
            const catId = crypto.randomUUID();
            const credId = crypto.randomUUID();

            // BEGIN
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            // UPDATE categories
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
            // UPDATE users
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
            // SELECT users
            mocks.clientQuery.mockResolvedValueOnce({
                rows: [{ id: userId, name: "testuser", total_amount: 300, total_allotment: 400 }],
                rowCount: 1,
            });
            // SELECT categories
            mocks.clientQuery.mockResolvedValueOnce({
                rows: [{ id: catId, user_id: userId, title: "Food", amount: 300, allotment: 400 }],
                rowCount: 1,
            });
            // SELECT charges
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            // COMMIT
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

            // credential lookup
            mocks.poolQuery.mockResolvedValueOnce({
                rows: [{ id: credId }],
                rowCount: 1,
            });

            const res = await request(app)
                .get(`/api/user/${userId}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(200);
            // Verify BEGIN was called
            expect(mocks.clientQuery.mock.calls[0][0]).toBe("BEGIN");
            // Verify UPDATE categories was called
            expect(mocks.clientQuery.mock.calls[1][0]).toContain("UPDATE categories");
            // Verify UPDATE users was called
            expect(mocks.clientQuery.mock.calls[2][0]).toContain("UPDATE users");
        });

        it("handles user with no categories or charges", async () => {
            const userId = crypto.randomUUID();
            const credId = crypto.randomUUID();

            // BEGIN
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            // UPDATE categories (no rows affected)
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            // UPDATE users
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
            // SELECT users
            mocks.clientQuery.mockResolvedValueOnce({
                rows: [{ id: userId, name: "testuser", total_amount: 0, total_allotment: 1000 }],
                rowCount: 1,
            });
            // SELECT categories (empty)
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            // SELECT charges (empty)
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            // COMMIT
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

            // credential lookup
            mocks.poolQuery.mockResolvedValueOnce({
                rows: [{ id: credId }],
                rowCount: 1,
            });

            const res = await request(app)
                .get(`/api/user/${userId}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.user.totalAmount).toBe(0);
            expect(res.body.categories).toHaveLength(0);
            expect(res.body.charges).toHaveLength(0);
        });

        it("handles categories with zero charges via COALESCE", async () => {
            const userId = crypto.randomUUID();
            const catWithCharges = crypto.randomUUID();
            const catWithoutCharges = crypto.randomUUID();
            const credId = crypto.randomUUID();

            // BEGIN
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            // UPDATE categories (LEFT JOIN handles zero-charge categories)
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 2 });
            // UPDATE users
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
            // SELECT users
            mocks.clientQuery.mockResolvedValueOnce({
                rows: [{ id: userId, name: "testuser", total_amount: 100, total_allotment: 550 }],
                rowCount: 1,
            });
            // SELECT categories
            mocks.clientQuery.mockResolvedValueOnce({
                rows: [
                    { id: catWithCharges, user_id: userId, title: "Food", amount: 100, allotment: 400 },
                    { id: catWithoutCharges, user_id: userId, title: "Gas", amount: 0, allotment: 150 },
                ],
                rowCount: 2,
            });
            // SELECT charges
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            // COMMIT
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

            // credential lookup
            mocks.poolQuery.mockResolvedValueOnce({
                rows: [{ id: credId }],
                rowCount: 1,
            });

            const res = await request(app)
                .get(`/api/user/${userId}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(200);
            // The UPDATE query uses COALESCE + LEFT JOIN so both categories are handled in one query
            const updateCall = mocks.clientQuery.mock.calls[1][0];
            expect(updateCall).toContain("COALESCE");
            expect(updateCall).toContain("LEFT JOIN");
        });

        it("returns error for invalid/nonexistent user", async () => {
            const userId = crypto.randomUUID();

            // BEGIN
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            // UPDATE categories
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            // UPDATE users
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            // SELECT users - not found
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            // ROLLBACK
            mocks.clientQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

            const res = await request(app)
                .get(`/api/user/${userId}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(404);
        });

        it("returns 401 without authentication", async () => {
            const res = await request(app)
                .get(`/api/user/${crypto.randomUUID()}`);

            expect(res.status).toBe(401);
        });
    });
});
