import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

const mockQuery = vi.fn();

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
import bcrypt from "bcrypt";

describe("Credential Routes", () => {
    beforeEach(() => {
        mocks.query.mockReset();
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
            // Check username exists - no rows
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            // Insert user
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });
            // Insert credential
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

            const res = await request(app)
                .post("/api/public/register")
                .send(registerPayload);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("New user created");
            expect(mocks.query).toHaveBeenCalledTimes(3);
        });

        it("hashes the password before storing", async () => {
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });
            mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

            await request(app)
                .post("/api/public/register")
                .send(registerPayload);

            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith("password123", "$2b$10$testsalt");
        });

        it("returns 404 when username already exists", async () => {
            mocks.query.mockResolvedValueOnce({
                rows: [{ id: crypto.randomUUID() }],
                rowCount: 1,
            });

            const res = await request(app)
                .post("/api/public/register")
                .send(registerPayload);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Unable to create new user");
            // Only the SELECT check should have been called
            expect(mocks.query).toHaveBeenCalledTimes(1);
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
        it("returns userId when authenticated", async () => {
            const credId = crypto.randomUUID();
            const userId = crypto.randomUUID();
            const token = jwt.sign(
                { id: credId, username: "testuser" },
                process.env.JWT_SECRET!,
                { expiresIn: "2h" }
            );

            mocks.query.mockResolvedValueOnce({
                rows: [{ user_id: userId }],
                rowCount: 1,
            });

            const res = await request(app)
                .get("/api/auth/userId")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.userId).toBe(userId);
        });

        it("returns 401 without auth token", async () => {
            const res = await request(app).get("/api/auth/userId");

            expect(res.status).toBe(401);
            expect(res.body.message).toBe("No token provided");
        });

        it("returns 401 with expired token", async () => {
            const token = jwt.sign(
                { id: crypto.randomUUID(), username: "testuser" },
                process.env.JWT_SECRET!,
                { expiresIn: "-1h" }
            );

            const res = await request(app)
                .get("/api/auth/userId")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(401);
            expect(res.body.message).toBe("Invalid or expired token");
        });
    });
});
