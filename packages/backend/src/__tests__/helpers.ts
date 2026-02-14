import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

export function generateTestToken(id?: string, username?: string): string {
    return jwt.sign(
        { id: id ?? new ObjectId().toString(), username: username ?? "testuser" },
        process.env.JWT_SECRET!,
        { expiresIn: "2h" }
    );
}

export function createMockCollections() {
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

    const mongoClient = {
        db: vi.fn(() => ({
            collection: vi.fn((name: string) => getCollection(name)),
        })),
        connect: vi.fn(),
    };

    return { mongoClient, getCollection, collections };
}

export function resetCollections(collections: Record<string, any>) {
    for (const col of Object.values(collections)) {
        for (const fn of Object.values(col as Record<string, any>)) {
            if (fn && typeof (fn as any).mockReset === "function") {
                (fn as any).mockReset();
            }
        }
        col.find.mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) });
        col.aggregate.mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) });
        col.bulkWrite.mockResolvedValue({});
    }
}
