import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

const mocks = vi.hoisted(() => {
    const query = vi.fn();
    return { query };
});

vi.mock("../postgres.database", () => ({
    pool: { query: mocks.query },
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

function authToken(id?: string) {
    return jwt.sign(
        { id: id ?? crypto.randomUUID(), username: "testuser" },
        process.env.JWT_SECRET!,
        { expiresIn: "2h" }
    );
}

describe("Net Worth Routes", () => {
    beforeEach(() => {
        mocks.query.mockReset();
    });

    // ─── Get Net Worth by User ──────────────────────────────────

    describe("GET /api/networth/:userId", () => {
        it("returns net worth items for a user", async () => {
            const userId = crypto.randomUUID();
            const items = [
                { id: crypto.randomUUID(), user_id: userId, name: "Savings", type: "asset", value: 10000, description: "Bank savings", date: "2024-01-15" },
                { id: crypto.randomUUID(), user_id: userId, name: "Car Loan", type: "liability", value: 5000, description: "Auto loan", date: "2024-01-15" },
            ];
            mocks.query.mockResolvedValueOnce({ rows: items, rowCount: 2 });

            const res = await request(app)
                .get(`/api/networth/${userId}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(mocks.query).toHaveBeenCalledTimes(1);
        });

        it("returns 401 without authentication", async () => {
            const res = await request(app)
                .get(`/api/networth/${crypto.randomUUID()}`);

            expect(res.status).toBe(401);
        });
    });

    // ─── Create Net Worth ───────────────────────────────────────

    describe("PUT /api/networth/new", () => {
        const payload = {
            userId: crypto.randomUUID(),
            name: "Savings Account",
            type: "asset",
            value: 15000,
            description: "Main savings",
            date: "2024-01-15",
        };

        it("creates a new net worth entry successfully", async () => {
            // BaseService.create -> INSERT INTO networth
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

            const res = await request(app)
                .put("/api/networth/new")
                .set("Authorization", `Bearer ${authToken()}`)
                .send(payload);

            expect(res.status).toBe(201);
            expect(res.body.message).toBe("Net Worth Created");
            expect(mocks.query).toHaveBeenCalledTimes(1);
        });

        it("passes userId as a parameter in the INSERT query", async () => {
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

            await request(app)
                .put("/api/networth/new")
                .set("Authorization", `Bearer ${authToken()}`)
                .send(payload);

            const call = mocks.query.mock.calls[0];
            expect(call[0]).toContain("INSERT INTO networth");
            // Values should include the userId
            expect(call[1]).toContain(payload.userId);
        });

        it("returns 404 when creation fails", async () => {
            mocks.query.mockRejectedValueOnce(new Error("Insert failed"));

            const res = await request(app)
                .put("/api/networth/new")
                .set("Authorization", `Bearer ${authToken()}`)
                .send(payload);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Net Worth Create Failed");
        });

        it("returns 401 without authentication", async () => {
            const res = await request(app)
                .put("/api/networth/new")
                .send(payload);

            expect(res.status).toBe(401);
        });
    });

    // ─── Update Net Worth ───────────────────────────────────────

    describe("PATCH /api/networth/:id", () => {
        it("updates a net worth entry successfully", async () => {
            const entryId = crypto.randomUUID();
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

            const res = await request(app)
                .patch(`/api/networth/${entryId}`)
                .set("Authorization", `Bearer ${authToken()}`)
                .send({
                    _id: entryId,
                    userId: crypto.randomUUID(),
                    name: "Updated Savings",
                    type: "asset",
                    value: 20000,
                    description: "Updated savings",
                    date: "2024-02-01",
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe("Net Worth Updated");
        });

        it("returns 404 when entry not found", async () => {
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

            const res = await request(app)
                .patch(`/api/networth/${crypto.randomUUID()}`)
                .set("Authorization", `Bearer ${authToken()}`)
                .send({
                    _id: crypto.randomUUID(),
                    userId: crypto.randomUUID(),
                    name: "Test",
                    type: "asset",
                    value: 100,
                    description: "Test",
                    date: "2024-01-01",
                });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Net Worth Update failed");
        });

        it("returns 401 without authentication", async () => {
            const res = await request(app)
                .patch(`/api/networth/${crypto.randomUUID()}`)
                .send({});

            expect(res.status).toBe(401);
        });
    });

    // ─── Delete Net Worth ───────────────────────────────────────

    describe("DELETE /api/networth/:id", () => {
        it("deletes a net worth entry successfully", async () => {
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

            const res = await request(app)
                .delete(`/api/networth/${crypto.randomUUID()}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Net Worth Deleted");
        });

        it("returns 404 when entry not found", async () => {
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

            const res = await request(app)
                .delete(`/api/networth/${crypto.randomUUID()}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Net Worth unable to be removed");
        });

        it("returns 401 without authentication", async () => {
            const res = await request(app)
                .delete(`/api/networth/${crypto.randomUUID()}`);

            expect(res.status).toBe(401);
        });
    });
});
