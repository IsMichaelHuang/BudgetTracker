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

function authToken() {
    return jwt.sign(
        { id: crypto.randomUUID(), username: "testuser" },
        process.env.JWT_SECRET!,
        { expiresIn: "2h" }
    );
}

describe("Category Routes", () => {
    beforeEach(() => {
        mocks.query.mockReset();
    });

    // ─── Create Category ────────────────────────────────────────

    describe("PUT /api/category/new", () => {
        const categoryPayload = {
            userId: crypto.randomUUID(),
            title: "Food",
            amount: 0,
            allotment: 400,
        };

        it("creates a new category successfully", async () => {
            // BaseService.create -> INSERT INTO categories
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

            const res = await request(app)
                .put("/api/category/new")
                .set("Authorization", `Bearer ${authToken()}`)
                .send(categoryPayload);

            expect(res.status).toBe(201);
            expect(res.body.message).toBe("Category Created");
            expect(mocks.query).toHaveBeenCalledTimes(1);
        });

        it("returns 404 when creation fails", async () => {
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

            const res = await request(app)
                .put("/api/category/new")
                .set("Authorization", `Bearer ${authToken()}`)
                .send(categoryPayload);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Category Creation Failed");
        });

        it("returns 401 without authentication", async () => {
            const res = await request(app)
                .put("/api/category/new")
                .send(categoryPayload);

            expect(res.status).toBe(401);
        });
    });

    // ─── Update Category ────────────────────────────────────────

    describe("PATCH /api/category/:id", () => {
        it("updates a category successfully", async () => {
            const catId = crypto.randomUUID();
            // BaseService.updateById -> UPDATE categories SET ... WHERE id = $1
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

            const res = await request(app)
                .patch(`/api/category/${catId}`)
                .set("Authorization", `Bearer ${authToken()}`)
                .send({
                    _id: catId,
                    userId: crypto.randomUUID(),
                    title: "Updated Food",
                    amount: 100,
                    allotment: 500,
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe("Category updated");
        });

        it("returns 404 when category not found", async () => {
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

            const res = await request(app)
                .patch(`/api/category/${crypto.randomUUID()}`)
                .set("Authorization", `Bearer ${authToken()}`)
                .send({
                    _id: crypto.randomUUID(),
                    userId: crypto.randomUUID(),
                    title: "Test",
                    amount: 0,
                    allotment: 100,
                });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Category Update Failed");
        });

        it("returns 401 without authentication", async () => {
            const res = await request(app)
                .patch(`/api/category/${crypto.randomUUID()}`)
                .send({});

            expect(res.status).toBe(401);
        });
    });

    // ─── Delete Category (with cascade via ON DELETE CASCADE) ────

    describe("DELETE /api/category/:id", () => {
        it("deletes category successfully (cascade handles charges)", async () => {
            const catId = crypto.randomUUID();
            // BaseService.deleteById -> DELETE FROM categories WHERE id = $1
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

            const res = await request(app)
                .delete(`/api/category/${catId}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(201);
            expect(res.body.message).toBe("Category removed");
            // Only one query for the DELETE (cascade handles charges)
            expect(mocks.query).toHaveBeenCalledTimes(1);
        });

        it("returns 404 when category not found", async () => {
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

            const res = await request(app)
                .delete(`/api/category/${crypto.randomUUID()}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Category Unable to be remove");
        });

        it("returns 401 without authentication", async () => {
            const res = await request(app)
                .delete(`/api/category/${crypto.randomUUID()}`);

            expect(res.status).toBe(401);
        });
    });
});
