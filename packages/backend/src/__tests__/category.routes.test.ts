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
        { id: new ObjectId().toString(), username: "testuser" },
        process.env.JWT_SECRET!,
        { expiresIn: "2h" }
    );
}

describe("Category Routes", () => {
    const categoriesCol = mocks.getCollection("categories");
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

    // ─── Create Category ────────────────────────────────────────

    describe("PUT /api/category/new", () => {
        const categoryPayload = {
            userId: new ObjectId().toString(),
            title: "Food",
            amount: 0,
            allotment: 400,
        };

        it("creates a new category successfully", async () => {
            categoriesCol.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

            const res = await request(app)
                .put("/api/category/new")
                .set("Authorization", `Bearer ${authToken()}`)
                .send(categoryPayload);

            expect(res.status).toBe(201);
            expect(res.body.message).toBe("Category Created");
            expect(categoriesCol.insertOne).toHaveBeenCalled();
        });

        it("returns 404 when creation fails", async () => {
            categoriesCol.insertOne.mockResolvedValue({ insertedId: null });

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
            const catId = new ObjectId();
            categoriesCol.updateOne.mockResolvedValue({ modifiedCount: 1 });

            const res = await request(app)
                .patch(`/api/category/${catId}`)
                .set("Authorization", `Bearer ${authToken()}`)
                .send({
                    _id: catId.toString(),
                    userId: new ObjectId().toString(),
                    title: "Updated Food",
                    amount: 100,
                    allotment: 500,
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe("Category updated");
        });

        it("returns 404 when category not found", async () => {
            categoriesCol.updateOne.mockResolvedValue({ modifiedCount: 0 });

            const res = await request(app)
                .patch(`/api/category/${new ObjectId()}`)
                .set("Authorization", `Bearer ${authToken()}`)
                .send({
                    _id: new ObjectId().toString(),
                    userId: new ObjectId().toString(),
                    title: "Test",
                    amount: 0,
                    allotment: 100,
                });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Category Update Failed");
        });

        it("returns 401 without authentication", async () => {
            const res = await request(app)
                .patch(`/api/category/${new ObjectId()}`)
                .send({});

            expect(res.status).toBe(401);
        });
    });

    // ─── Delete Category (with cascade) ─────────────────────────

    describe("DELETE /api/category/:id", () => {
        it("deletes category and cascades to charges", async () => {
            const catId = new ObjectId();
            chargesCol.deleteMany.mockResolvedValue({ deletedCount: 3 });
            categoriesCol.deleteOne.mockResolvedValue({ deletedCount: 1 });

            const res = await request(app)
                .delete(`/api/category/${catId}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(201);
            expect(res.body.message).toBe("Category removed");
            expect(chargesCol.deleteMany).toHaveBeenCalledWith({
                categoryId: expect.any(ObjectId),
            });
            expect(categoriesCol.deleteOne).toHaveBeenCalled();
        });

        it("deletes charges even when category has none", async () => {
            const catId = new ObjectId();
            chargesCol.deleteMany.mockResolvedValue({ deletedCount: 0 });
            categoriesCol.deleteOne.mockResolvedValue({ deletedCount: 1 });

            const res = await request(app)
                .delete(`/api/category/${catId}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(201);
            expect(chargesCol.deleteMany).toHaveBeenCalled();
        });

        it("returns 404 when category not found", async () => {
            chargesCol.deleteMany.mockResolvedValue({ deletedCount: 0 });
            categoriesCol.deleteOne.mockResolvedValue({ deletedCount: 0 });

            const res = await request(app)
                .delete(`/api/category/${new ObjectId()}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Category Unable to be remove");
        });

        it("returns 401 without authentication", async () => {
            const res = await request(app)
                .delete(`/api/category/${new ObjectId()}`);

            expect(res.status).toBe(401);
        });
    });
});
