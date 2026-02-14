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

describe("Charge Routes", () => {
    const chargesCol = mocks.getCollection("charges");

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

    // ─── Create Charge ──────────────────────────────────────────

    describe("PUT /api/charge/new", () => {
        const chargePayload = {
            userId: new ObjectId().toString(),
            categoryId: new ObjectId().toString(),
            description: "Grocery shopping",
            amount: 50.25,
            date: "2024-01-15",
        };

        it("creates a new charge successfully", async () => {
            chargesCol.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

            const res = await request(app)
                .put("/api/charge/new")
                .set("Authorization", `Bearer ${authToken()}`)
                .send(chargePayload);

            expect(res.status).toBe(201);
            expect(res.body.message).toBe("Charge Created");
            expect(chargesCol.insertOne).toHaveBeenCalled();
        });

        it("converts string IDs to ObjectIds before inserting", async () => {
            chargesCol.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

            await request(app)
                .put("/api/charge/new")
                .set("Authorization", `Bearer ${authToken()}`)
                .send(chargePayload);

            const insertArg = chargesCol.insertOne.mock.calls[0][0];
            expect(insertArg.userId).toBeInstanceOf(ObjectId);
            expect(insertArg.categoryId).toBeInstanceOf(ObjectId);
        });

        it("returns 404 when creation fails", async () => {
            chargesCol.insertOne.mockRejectedValue(new Error("Insert failed"));

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
            const chargeId = new ObjectId();
            chargesCol.updateOne.mockResolvedValue({ modifiedCount: 1 });

            const res = await request(app)
                .patch(`/api/charge/${chargeId}`)
                .set("Authorization", `Bearer ${authToken()}`)
                .send({
                    _id: chargeId.toString(),
                    userId: new ObjectId().toString(),
                    categoryId: new ObjectId().toString(),
                    description: "Updated grocery",
                    amount: 75.00,
                    date: "2024-01-20",
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe("Charge Updated");
        });

        it("returns 404 when charge not found", async () => {
            chargesCol.updateOne.mockResolvedValue({ modifiedCount: 0 });

            const res = await request(app)
                .patch(`/api/charge/${new ObjectId()}`)
                .set("Authorization", `Bearer ${authToken()}`)
                .send({
                    _id: new ObjectId().toString(),
                    userId: new ObjectId().toString(),
                    categoryId: new ObjectId().toString(),
                    description: "Test",
                    amount: 10,
                    date: "2024-01-01",
                });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Charge Update failed");
        });

        it("returns 401 without authentication", async () => {
            const res = await request(app)
                .patch(`/api/charge/${new ObjectId()}`)
                .send({});

            expect(res.status).toBe(401);
        });
    });

    // ─── Delete Charge ──────────────────────────────────────────

    describe("DELETE /api/charge/:id", () => {
        it("deletes a charge successfully", async () => {
            chargesCol.deleteOne.mockResolvedValue({ deletedCount: 1 });

            const res = await request(app)
                .delete(`/api/charge/${new ObjectId()}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Charge Deleted");
        });

        it("returns 404 when charge not found", async () => {
            chargesCol.deleteOne.mockResolvedValue({ deletedCount: 0 });

            const res = await request(app)
                .delete(`/api/charge/${new ObjectId()}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Charge unable to be remove");
        });

        it("returns 401 without authentication", async () => {
            const res = await request(app)
                .delete(`/api/charge/${new ObjectId()}`);

            expect(res.status).toBe(401);
        });
    });
});
