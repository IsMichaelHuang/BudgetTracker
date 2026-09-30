import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

const mockQuery = vi.fn();

const mocks = vi.hoisted(() => {
    const query = vi.fn();
    const cQuery = vi.fn();
    const release = vi.fn();
    const connect = vi.fn();
    return { query, cQuery, release, connect };
});

vi.mock("../postgres.database", () => ({
    pool: { query: mocks.query, connect: mocks.connect },
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
import { testToken } from "./helpers";
import bcrypt from "bcrypt";

describe("Credential Routes", () => {
    beforeEach(() => {
        mocks.query.mockReset();
        mocks.cQuery.mockReset().mockResolvedValue({ rows: [], rowCount: 1 });
        mocks.release.mockReset();
        mocks.connect.mockReset().mockResolvedValue({
            query: mocks.cQuery,
            release: mocks.release,
        });
        (bcrypt.genSalt as any).mockResolvedValue("$2b$10$testsalt");
        (bcrypt.hash as any).mockResolvedValue("$2b$10$hashedpassword");
        (bcrypt.compare as any).mockResolvedValue(true);
    });

    // ─── Registration ───────────────────────────────────────────

    describe("POST /api/public/register", () => {
        const registerPayload = {
            username: "newuser",
            email: "new@test.com",
            plainTextPassword: "password123",
            userData: { totalAmount: 0, totalAllotment: 1000 },
        };

        it("registers a new user successfully", async () => {
            const res = await request(app)
                .post("/api/public/register")
                .send(registerPayload);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("New user created");
            // BEGIN, insert user, insert credential, COMMIT
            expect(mocks.cQuery).toHaveBeenCalledTimes(4);
        });

        it("hashes the password before storing", async () => {

            await request(app)
                .post("/api/public/register")
                .send(registerPayload);

            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith("password123", "$2b$10$testsalt");
        });

        it("does not log the plaintext password", async () => {
            const spies = (["log", "info", "debug"] as const).map((m) =>
                vi.spyOn(console, m).mockImplementation(() => {})
            );

            const res = await request(app)
                .post("/api/public/register")
                .send(registerPayload);

            const logged = spies.flatMap((spy) => spy.mock.calls.flat());
            spies.forEach((spy) => spy.mockRestore());
            expect(res.status).toBe(200);
            expect(JSON.stringify(logged)).not.toContain("password123");
        });

        it("returns 409 when username already exists", async () => {
            // Intentional contract change: was 404 from a SELECT check.
            mocks.cQuery
                .mockResolvedValueOnce({}) // BEGIN
                .mockRejectedValueOnce(
                    Object.assign(new Error("duplicate"), {
                        code: "23505",
                        constraint: "user_credentials_username_key",
                    })
                );

            const res = await request(app)
                .post("/api/public/register")
                .send(registerPayload);

            expect(res.status).toBe(409);
            expect(mocks.cQuery.mock.calls.map((c) => c[0])).toContain(
                "ROLLBACK"
            );
            expect(mocks.release).toHaveBeenCalledTimes(1);
        });
    });

    // ─── Login ──────────────────────────────────────────────────

    describe("POST /api/public/login", () => {
        it("returns a valid JWT token on successful login", async () => {
            const credId = crypto.randomUUID();
            mocks.query.mockResolvedValueOnce({
                rows: [{
                    id: credId,
                    username: "testuser",
                    hashed_password: "$2b$10$hashedpassword",
                    user_id: crypto.randomUUID(),
                }],
                rowCount: 1,
            });
            (bcrypt.compare as any).mockResolvedValue(true);

            const res = await request(app)
                .post("/api/public/login")
                .send({ username: "testuser", password: "password123" });

            expect(res.status).toBe(200);
            expect(res.body.token).toBeDefined();

            const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET!) as any;
            expect(decoded.id).toBe(credId);
            expect(decoded.username).toBe("testuser");
        });

        it("returns 401 when password is incorrect", async () => {
            mocks.query.mockResolvedValueOnce({
                rows: [{
                    id: crypto.randomUUID(),
                    username: "testuser",
                    hashed_password: "$2b$10$hashedpassword",
                    user_id: crypto.randomUUID(),
                }],
                rowCount: 1,
            });
            (bcrypt.compare as any).mockResolvedValue(false);

            const res = await request(app)
                .post("/api/public/login")
                .send({ username: "testuser", password: "wrongpassword" });

            expect(res.status).toBe(401);
        });

        it("returns 401 when user does not exist", async () => {
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

            const res = await request(app)
                .post("/api/public/login")
                .send({ username: "nonexistent", password: "password123" });

            expect(res.status).toBe(401);
        });
    });

    // ─── Get User ID by Token ───────────────────────────────────

    describe("GET /api/auth/userId", () => {
        it("returns userId from the token without a query", async () => {
            const { token, userId } = testToken();

            const res = await request(app)
                .get("/api/auth/userId")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.userId).toBe(userId);
            expect(mocks.query).not.toHaveBeenCalled();
        });

        it("returns 401 without auth token", async () => {
            const res = await request(app).get("/api/auth/userId");

            expect(res.status).toBe(401);
            expect(res.body.message).toBe("No token provided");
        });

        it("returns 401 with expired token", async () => {
            const { token } = testToken({ expiresIn: "-1h" });

            const res = await request(app)
                .get("/api/auth/userId")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(401);
            expect(res.body.message).toBe("Invalid or expired token");
        });
    });
});
