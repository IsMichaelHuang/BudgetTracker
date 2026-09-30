import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

const mocks = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock("../postgres.database", () => ({
    pool: { query: mocks.query },
    connectPostgres: vi.fn(),
    closePostgres: vi.fn(),
}));

vi.mock("bcrypt", () => {
    const mock = {
        genSalt: vi.fn().mockResolvedValue("salt"),
        hash: vi.fn().mockResolvedValue("hash"),
        compare: vi.fn().mockResolvedValue(true),
    };
    return { ...mock, default: mock };
});

import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import { testToken } from "./helpers";

describe("login token identity", () => {
    beforeEach(() => mocks.query.mockReset());

    it("includes id, username and userId, signed HS256", async () => {
        const id = crypto.randomUUID();
        const userId = crypto.randomUUID();
        mocks.query.mockResolvedValueOnce({
            rows: [{
                id,
                username: "alice",
                hashed_password: "h",
                user_id: userId,
            }],
            rowCount: 1,
        });

        const res = await request(app)
            .post("/api/public/login")
            .send({ username: "alice", password: "password123" });

        expect(res.status).toBe(200);
        const full = jwt.decode(res.body.token, { complete: true })!;
        expect(full.header.alg).toBe("HS256");
        expect(full.payload).toMatchObject({ id, username: "alice", userId });
        expect(mocks.query.mock.calls[0][0]).toContain("user_id");
    });

    it("the issued token is accepted by protected routes", async () => {
        const userId = crypto.randomUUID();
        mocks.query.mockResolvedValueOnce({
            rows: [{
                id: crypto.randomUUID(),
                username: "alice",
                hashed_password: "h",
                user_id: userId,
            }],
            rowCount: 1,
        });
        const login = await request(app)
            .post("/api/public/login")
            .send({ username: "alice", password: "password123" });

        const res = await request(app)
            .get("/api/auth/userId")
            .set("Authorization", `Bearer ${login.body.token}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ userId });
    });
});

describe("GET /api/auth/userId", () => {
    beforeEach(() => mocks.query.mockReset());

    it("answers from the token claim with no DB query", async () => {
        const { token, userId } = testToken();

        const res = await request(app)
            .get("/api/auth/userId")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ userId });
        expect(mocks.query).not.toHaveBeenCalled();
    });

    it("is not reachable on the public mount", async () => {
        const res = await request(app).get("/api/public/userId");

        // Falls through to the auth wall: 401, never a 500.
        expect(res.status).toBe(401);
        expect(mocks.query).not.toHaveBeenCalled();
    });

    it("keeps login and register off the auth mount", async () => {
        const { token } = testToken();
        for (const p of ["/api/auth/login", "/api/auth/register"]) {
            const res = await request(app)
                .post(p)
                .set("Authorization", `Bearer ${token}`)
                .send({});
            expect(res.status).toBe(404);
        }
    });
});
