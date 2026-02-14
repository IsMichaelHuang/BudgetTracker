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

describe("Charge Routes", () => {
    beforeEach(() => {
        mocks.query.mockReset();
    });

    // ─── Create Charge ──────────────────────────────────────────

    describe("PUT /api/charge/new", () => {
        const chargePayload = {
            userId: crypto.randomUUID(),
            categoryId: crypto.randomUUID(),
            description: "Grocery shopping",
            amount: 50.25,
            date: "2024-01-15",
        };

        it("creates a new charge successfully", async () => {
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

            const res = await request(app)
                .put("/api/charge/new")
                .set("Authorization", `Bearer ${authToken()}`)
                .send(chargePayload);

            expect(res.status).toBe(201);
            expect(res.body.message).toBe("Charge Created");
            expect(mocks.query).toHaveBeenCalledTimes(1);
        });

        it("passes correct parameters to INSERT query", async () => {
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

            await request(app)
                .put("/api/charge/new")
                .set("Authorization", `Bearer ${authToken()}`)
                .send(chargePayload);

            const call = mocks.query.mock.calls[0];
            expect(call[0]).toContain("INSERT INTO charges");
            // Should have 6 params: id, user_id, category_id, description, amount, date
            expect(call[1]).toHaveLength(6);
        });

        it("returns 404 when creation fails", async () => {
            mocks.query.mockRejectedValueOnce(new Error("Insert failed"));

            const res = await request(app)
                .put("/api/charge/new")
                .set("Authorization", `Bearer ${authToken()}`)
                .send(chargePayload);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Charge Create Failed");
        });

        it("returns 401 without authentication", async () => {
            const res = await request(app)
                .put("/api/charge/new")
                .send(chargePayload);

            expect(res.status).toBe(401);
        });
    });

    // ─── Update Charge ──────────────────────────────────────────

    describe("PATCH /api/charge/:id", () => {
        it("updates a charge successfully", async () => {
            const chargeId = crypto.randomUUID();
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

            const res = await request(app)
                .patch(`/api/charge/${chargeId}`)
                .set("Authorization", `Bearer ${authToken()}`)
                .send({
                    _id: chargeId,
                    userId: crypto.randomUUID(),
                    categoryId: crypto.randomUUID(),
                    description: "Updated grocery",
                    amount: 75.00,
                    date: "2024-01-20",
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe("Charge Updated");
        });

        it("returns 404 when charge not found", async () => {
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

            const res = await request(app)
                .patch(`/api/charge/${crypto.randomUUID()}`)
                .set("Authorization", `Bearer ${authToken()}`)
                .send({
                    _id: crypto.randomUUID(),
                    userId: crypto.randomUUID(),
                    categoryId: crypto.randomUUID(),
                    description: "Test",
                    amount: 10,
                    date: "2024-01-01",
                });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Charge Update failed");
        });

        it("returns 401 without authentication", async () => {
            const res = await request(app)
                .patch(`/api/charge/${crypto.randomUUID()}`)
                .send({});

            expect(res.status).toBe(401);
        });
    });

    // ─── Delete Charge ──────────────────────────────────────────

    describe("DELETE /api/charge/:id", () => {
        it("deletes a charge successfully", async () => {
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

            const res = await request(app)
                .delete(`/api/charge/${crypto.randomUUID()}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Charge Deleted");
        });

        it("returns 404 when charge not found", async () => {
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

            const res = await request(app)
                .delete(`/api/charge/${crypto.randomUUID()}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Charge unable to be remove");
        });

        it("returns 401 without authentication", async () => {
            const res = await request(app)
                .delete(`/api/charge/${crypto.randomUUID()}`);

            expect(res.status).toBe(401);
        });
    });
});
