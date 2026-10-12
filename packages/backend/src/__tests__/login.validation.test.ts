import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({ query: vi.fn(), connect: vi.fn() }));

vi.mock("../postgres.database", () => ({
    pool: { query: mocks.query, connect: mocks.connect },
    connectPostgres: vi.fn(),
    closePostgres: vi.fn(),
}));

import request from "supertest";
import app from "../app";

describe("POST /api/public/login validation", () => {
    beforeEach(() => {
        mocks.query.mockReset().mockResolvedValue({ rows: [], rowCount: 0 });
    });

    const bad: [string, unknown][] = [
        ["missing password", { username: "alice" }],
        ["missing username", { password: "password123" }],
        ["empty password", { username: "alice", password: "" }],
        ["non-string username", { username: { $ne: 1 }, password: "x" }],
        ["array password", { username: "alice", password: ["a"] }],
        ["extra key", { username: "alice", password: "pw", admin: true }],
        ["password over 72 chars", { username: "a", password: "p".repeat(73) }],
        ["username over 255 chars", { username: "u".repeat(256), password: "p" }],
        ["array body", ["alice", "pw"]],
    ];

    it.each(bad)("returns 400 for %s and runs no query", async (_n, body) => {
        const res = await request(app).post("/api/public/login").send(body as object);
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Invalid request body");
        expect(mocks.query).not.toHaveBeenCalled();
    });

    it("still answers a well-formed unknown user with 401", async () => {
        const res = await request(app)
            .post("/api/public/login")
            .send({ username: "nobody", password: "password123" });
        expect(res.status).toBe(401);
    });
});
