import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

// Create mock infrastructure before module loading
const mocks = vi.hoisted(() => {
    const collections: Record<string, any> = {};
    const getCollection = (name: string) => {
        if (!collections[name]) {
            collections[name] = {
                findOne: vi.fn(),
                insertOne: vi.fn(),
                updateOne: vi.fn(),
                deleteOne: vi.fn(),
                deleteMany: vi.fn(),
                find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
                aggregate: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
                bulkWrite: vi.fn().mockResolvedValue({}),
            };
        }
        return collections[name];
    };
    return {
        mongoClient: {
            db: vi.fn(() => ({ collection: vi.fn((name: string) => getCollection(name)) })),
        },
        getCollection,
        collections,
    };
});

vi.mock("../mongo.database", () => ({
    mongoClient: mocks.mongoClient,
    connectMongo: vi.fn(),
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
    const usersCol = mocks.getCollection("users");
    const credsCol = mocks.getCollection("user_credentials");

    beforeEach(() => {
        for (const col of Object.values(mocks.collections)) {
            for (const fn of Object.values(col as Record<string, any>)) {
                if (fn && typeof (fn as any).mockReset === "function") {
                    (fn as any).mockReset();
                }
            }
            col.find.mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) });
            col.aggregate.mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) });
            col.bulkWrite.mockResolvedValue({});
        }
        // Reset bcrypt mocks to defaults
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
            credsCol.findOne.mockResolvedValue(null);
            credsCol.insertOne.mockResolvedValue({ insertedId: new ObjectId() });
            usersCol.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

            const res = await request(app)
                .post("/api/public/register")
                .send(registerPayload);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("New user created");
            expect(credsCol.insertOne).toHaveBeenCalled();
            expect(usersCol.insertOne).toHaveBeenCalled();
        });

        it("hashes the password before storing", async () => {
            credsCol.findOne.mockResolvedValue(null);
            credsCol.insertOne.mockResolvedValue({ insertedId: new ObjectId() });
            usersCol.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

            await request(app)
                .post("/api/public/register")
                .send(registerPayload);

            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith("password123", "$2b$10$testsalt");
        });

        it("returns 404 when username already exists", async () => {
            credsCol.findOne.mockResolvedValue({
                _id: new ObjectId(),
                username: "newuser",
            });

            const res = await request(app)
                .post("/api/public/register")
                .send(registerPayload);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Unable to create new user");
            expect(credsCol.insertOne).not.toHaveBeenCalled();
        });
    });

    // ─── Login ──────────────────────────────────────────────────

    describe("POST /api/public/login", () => {
        it("returns a valid JWT token on successful login", async () => {
            const credId = new ObjectId();
            credsCol.findOne.mockResolvedValue({
                _id: credId,
                username: "testuser",
                email: "test@test.com",
                password: "$2b$10$hashedpassword",
            });
            (bcrypt.compare as any).mockResolvedValue(true);

            const res = await request(app)
                .post("/api/public/login")
                .send({ username: "testuser", password: "password123" });

            expect(res.status).toBe(200);
            expect(res.body.token).toBeDefined();

            const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET!) as any;
            expect(decoded.id).toBe(credId.toString());
            expect(decoded.username).toBe("testuser");
        });

        it("returns 401 when password is incorrect", async () => {
            credsCol.findOne.mockResolvedValue({
                _id: new ObjectId(),
                username: "testuser",
                password: "$2b$10$hashedpassword",
            });
            (bcrypt.compare as any).mockResolvedValue(false);

            const res = await request(app)
                .post("/api/public/login")
                .send({ username: "testuser", password: "wrongpassword" });

            expect(res.status).toBe(401);
        });

        it("returns 401 when user does not exist", async () => {
            credsCol.findOne.mockResolvedValue(null);

            const res = await request(app)
                .post("/api/public/login")
                .send({ username: "nonexistent", password: "password123" });

            expect(res.status).toBe(401);
        });
    });

    // ─── Get User ID by Token ───────────────────────────────────

    describe("GET /api/auth/userId", () => {
        it("returns userId when authenticated", async () => {
            const credId = new ObjectId();
            const userId = new ObjectId();
            const token = jwt.sign(
                { id: credId.toString(), username: "testuser" },
                process.env.JWT_SECRET!,
                { expiresIn: "2h" }
            );

            usersCol.findOne.mockResolvedValue({
                _id: userId,
                userCred: credId,
                name: "testuser",
                totalAmount: 0,
                totalAllotment: 1000,
            });

            const res = await request(app)
                .get("/api/auth/userId")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.userId).toBe(userId.toString());
        });

        it("returns 401 without auth token", async () => {
            const res = await request(app).get("/api/auth/userId");

            expect(res.status).toBe(401);
            expect(res.body.message).toBe("No token provided");
        });

        it("returns 401 with expired token", async () => {
            const token = jwt.sign(
                { id: new ObjectId().toString(), username: "testuser" },
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
