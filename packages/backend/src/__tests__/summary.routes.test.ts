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

describe("Summary Routes", () => {
    const usersCol = mocks.getCollection("users");
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

    describe("GET /api/user/:id", () => {
        it("returns full summary with user, categories, and charges", async () => {
            const userId = new ObjectId();
            const catId1 = new ObjectId();
            const catId2 = new ObjectId();
            const chargeId1 = new ObjectId();
            const chargeId2 = new ObjectId();

            const fullCategories = [
                { _id: catId1, userId, title: "Food", amount: 150, allotment: 400 },
                { _id: catId2, userId, title: "Gas", amount: 50, allotment: 150 },
            ];

            const fullCharges = [
                { _id: chargeId1, userId, categoryId: catId1, description: "Groceries", amount: 150, date: new Date() },
                { _id: chargeId2, userId, categoryId: catId2, description: "Gas fill", amount: 50, date: new Date() },
            ];

            const user = {
                _id: userId,
                userCred: new ObjectId(),
                name: "testuser",
                totalAmount: 200,
                totalAllotment: 550,
            };

            // 1. chargesCollection.aggregate → sums by category
            chargesCol.aggregate.mockReturnValue({
                toArray: vi.fn().mockResolvedValue([
                    { _id: catId1, totalAmount: 150 },
                    { _id: catId2, totalAmount: 50 },
                ]),
            });

            // 2. categoriesCollection.find (projection: {_id:1}) → category IDs
            // 3. categoriesCollection.find (all fields) → full categories
            categoriesCol.find
                .mockReturnValueOnce({
                    toArray: vi.fn().mockResolvedValue([{ _id: catId1 }, { _id: catId2 }]),
                })
                .mockReturnValueOnce({
                    toArray: vi.fn().mockResolvedValue(fullCategories),
                });

            // 4. categoriesCollection.bulkWrite → update amounts
            categoriesCol.bulkWrite.mockResolvedValue({});

            // 5. categoriesCollection.aggregate → total amount
            categoriesCol.aggregate.mockReturnValue({
                toArray: vi.fn().mockResolvedValue([{ _id: null, totalAmount: 200 }]),
            });

            // 6. usersCollection.updateOne → update user total
            usersCol.updateOne.mockResolvedValue({ modifiedCount: 1 });

            // 7. usersCollection.findOne → return user
            usersCol.findOne.mockResolvedValue(user);

            // 8. chargesCollection.find → all charges
            chargesCol.find.mockReturnValue({
                toArray: vi.fn().mockResolvedValue(fullCharges),
            });

            const res = await request(app)
                .get(`/api/user/${userId}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.user).toBeDefined();
            expect(res.body.user.name).toBe("testuser");
            expect(res.body.categories).toHaveLength(2);
            expect(res.body.charges).toHaveLength(2);
        });

        it("aggregates charge totals by category", async () => {
            const userId = new ObjectId();
            const catId = new ObjectId();

            // Charges aggregate returns sum
            chargesCol.aggregate.mockReturnValue({
                toArray: vi.fn().mockResolvedValue([
                    { _id: catId, totalAmount: 300 },
                ]),
            });

            categoriesCol.find
                .mockReturnValueOnce({
                    toArray: vi.fn().mockResolvedValue([{ _id: catId }]),
                })
                .mockReturnValueOnce({
                    toArray: vi.fn().mockResolvedValue([
                        { _id: catId, userId, title: "Food", amount: 300, allotment: 400 },
                    ]),
                });

            categoriesCol.bulkWrite.mockResolvedValue({});
            categoriesCol.aggregate.mockReturnValue({
                toArray: vi.fn().mockResolvedValue([{ _id: null, totalAmount: 300 }]),
            });

            usersCol.updateOne.mockResolvedValue({ modifiedCount: 1 });
            usersCol.findOne.mockResolvedValue({
                _id: userId,
                userCred: new ObjectId(),
                name: "testuser",
                totalAmount: 300,
                totalAllotment: 400,
            });

            chargesCol.find.mockReturnValue({
                toArray: vi.fn().mockResolvedValue([]),
            });

            const res = await request(app)
                .get(`/api/user/${userId}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(200);
            // Verify bulkWrite was called to update category amounts
            expect(categoriesCol.bulkWrite).toHaveBeenCalled();
            // Verify user's totalAmount was updated
            expect(usersCol.updateOne).toHaveBeenCalled();
        });

        it("handles user with no categories or charges", async () => {
            const userId = new ObjectId();

            chargesCol.aggregate.mockReturnValue({
                toArray: vi.fn().mockResolvedValue([]),
            });

            categoriesCol.find
                .mockReturnValueOnce({
                    toArray: vi.fn().mockResolvedValue([]),
                })
                .mockReturnValueOnce({
                    toArray: vi.fn().mockResolvedValue([]),
                });

            categoriesCol.aggregate.mockReturnValue({
                toArray: vi.fn().mockResolvedValue([]),
            });

            usersCol.updateOne.mockResolvedValue({ modifiedCount: 1 });
            usersCol.findOne.mockResolvedValue({
                _id: userId,
                userCred: new ObjectId(),
                name: "testuser",
                totalAmount: 0,
                totalAllotment: 1000,
            });

            chargesCol.find.mockReturnValue({
                toArray: vi.fn().mockResolvedValue([]),
            });

            const res = await request(app)
                .get(`/api/user/${userId}`)
                .set("Authorization", `Bearer ${authToken()}`);

            expect(res.status).toBe(200);
            expect(res.body.user.totalAmount).toBe(0);
            expect(res.body.categories).toHaveLength(0);
            expect(res.body.charges).toHaveLength(0);
        });

        it("sets amount to 0 for categories with no charges", async () => {
            const userId = new ObjectId();
            const catWithCharges = new ObjectId();
            const catWithoutCharges = new ObjectId();

            // Only catWithCharges has charges
            chargesCol.aggregate.mockReturnValue({
                toArray: vi.fn().mockResolvedValue([
                    { _id: catWithCharges, totalAmount: 100 },
                ]),
            });

            // All categories
            categoriesCol.find
                .mockReturnValueOnce({
                    toArray: vi.fn().mockResolvedValue([
                        { _id: catWithCharges },
                        { _id: catWithoutCharges },
                    ]),
                })
                .mockReturnValueOnce({
                    toArray: vi.fn().mockResolvedValue([
                        { _id: catWithCharges, userId, title: "Food", amount: 100, allotment: 400 },
                        { _id: catWithoutCharges, userId, title: "Gas", amount: 0, allotment: 150 },
                    ]),
                });

            categoriesCol.bulkWrite.mockResolvedValue({});
            categoriesCol.aggregate.mockReturnValue({
                toArray: vi.fn().mockResolvedValue([{ _id: null, totalAmount: 100 }]),
            });

            usersCol.updateOne.mockResolvedValue({ modifiedCount: 1 });
            usersCol.findOne.mockResolvedValue({
                _id: userId,
                userCred: new ObjectId(),
                name: "testuser",
                totalAmount: 100,
                totalAllotment: 550,
            });

            chargesCol.find.mockReturnValue({
                toArray: vi.fn().mockResolvedValue([]),
            });

            await request(app)
                .get(`/api/user/${userId}`)
                .set("Authorization", `Bearer ${authToken()}`);

            // bulkWrite should include both charge-based and no-charge operations
            const bulkWriteArg = categoriesCol.bulkWrite.mock.calls[0][0];
            expect(bulkWriteArg).toHaveLength(2);
        });

        it("returns error for invalid user ID format", async () => {
            const res = await request(app)
                .get("/api/user/invalid-id")
                .set("Authorization", `Bearer ${authToken()}`);

            // Invalid ObjectId throws in service, caught by controller, forwarded to Express error handler
            expect(res.status).toBeGreaterThanOrEqual(400);
        });

        it("returns 401 without authentication", async () => {
            const res = await request(app)
                .get(`/api/user/${new ObjectId()}`);

            expect(res.status).toBe(401);
        });
    });
});
