import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

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

// bcrypt mock needed because credential.controller loads at app import time
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
        { id: id ?? new ObjectId().toString(), username: "testuser" },
        process.env.JWT_SECRET!,
        { expiresIn: "2h" }
    );
}

describe("Net Worth Routes", () => {
    const networthCol = mocks.getCollection("networth");

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
    });

    // ─── Get Net Worth by User ──────────────────────────────────

    describe("GET /api/networth/:userId", () => {
        it("returns net worth items for a user", async () => {
            const userId = new ObjectId();
            const items = [
                { _id: new ObjectId(), userId, name: "Savings", type: "asset", value: 10000, description: "Bank savings", date: "2024-01-15" },
                { _id: new ObjectId(), userId, name: "Car Loan", type: "liability", value: 5000, description: "Auto loan", date: "2024-01-15" },
            ];
            networthCol.find.mockReturnValue({ toArray: vi.fn().mockResolvedValue(items) });

            const res = await request(app)
                .get(`/api/networth/${userId}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(networthCol.find).toHaveBeenCalled();
        });

        it("returns 401 without authentication", async () => {
            const res = await request(app)
                .get(`/api/networth/${new ObjectId()}`);

            expect(res.status).toBe(401);
        });
    });

    // ─── Create Net Worth ───────────────────────────────────────

    describe("PUT /api/networth/new", () => {
        const payload = {
            userId: new ObjectId().toString(),
            name: "Savings Account",
            type: "asset",
            value: 15000,
            description: "Main savings",
            date: "2024-01-15",
        };

        it("creates a new net worth entry successfully", async () => {
            networthCol.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

            const res = await request(app)
                .put("/api/networth/new")
                .set("Authorization", `Bearer ${authToken()}`)
                .send(payload);

            expect(res.status).toBe(201);
            expect(res.body.message).toBe("Net Worth Created");
            expect(networthCol.insertOne).toHaveBeenCalled();
        });

        it("converts string userId to ObjectId before inserting", async () => {
            networthCol.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

            await request(app)
                .put("/api/networth/new")
                .set("Authorization", `Bearer ${authToken()}`)
                .send(payload);

            const insertArg = networthCol.insertOne.mock.calls[0][0];
            expect(insertArg.userId).toBeInstanceOf(ObjectId);
        });

        it("returns 404 when creation fails", async () => {
            networthCol.insertOne.mockRejectedValue(new Error("Insert failed"));

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
            const entryId = new ObjectId();
            networthCol.updateOne.mockResolvedValue({ modifiedCount: 1 });

            const res = await request(app)
                .patch(`/api/networth/${entryId}`)
                .set("Authorization", `Bearer ${authToken()}`)
                .send({
                    _id: entryId.toString(),
                    userId: new ObjectId().toString(),
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
            networthCol.updateOne.mockResolvedValue({ modifiedCount: 0 });

            const res = await request(app)
                .patch(`/api/networth/${new ObjectId()}`)
                .set("Authorization", `Bearer ${authToken()}`)
                .send({
                    _id: new ObjectId().toString(),
                    userId: new ObjectId().toString(),
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
                .patch(`/api/networth/${new ObjectId()}`)
                .send({});

            expect(res.status).toBe(401);
        });
    });

    // ─── Delete Net Worth ───────────────────────────────────────

    describe("DELETE /api/networth/:id", () => {
        it("deletes a net worth entry successfully", async () => {
            networthCol.deleteOne.mockResolvedValue({ deletedCount: 1 });

            const res = await request(app)
                .delete(`/api/networth/${new ObjectId()}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Net Worth Deleted");
        });

        it("returns 404 when entry not found", async () => {
            networthCol.deleteOne.mockResolvedValue({ deletedCount: 0 });

            const res = await request(app)
                .delete(`/api/networth/${new ObjectId()}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Net Worth unable to be removed");
        });

        it("returns 401 without authentication", async () => {
            const res = await request(app)
                .delete(`/api/networth/${new ObjectId()}`);

            expect(res.status).toBe(401);
        });
    });
});
