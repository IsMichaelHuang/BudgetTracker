import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

const mocks = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock("../postgres.database", () => ({
    pool: { query: mocks.query },
    connectPostgres: vi.fn(),
    closePostgres: vi.fn(),
}));

import request from "supertest";
import app from "../app";
import { testToken } from "./helpers";

const A = testToken({ username: "alice" });
const B = testToken({ username: "bob" });
const auth = (t = A) => ({ Authorization: `Bearer ${t.token}` });
const uuid = () => crypto.randomUUID();

const item = {
    name: "Savings",
    type: "asset",
    value: 100,
    description: "d",
    date: "2024-01-15",
};

function lastCall() {
    const [sql, params] = mocks.query.mock.calls.at(-1)!;
    return { sql: sql as string, params: params as unknown[] };
}

describe("net worth authz: read", () => {
    beforeEach(() => mocks.query.mockReset());

    it("scopes SELECT to the token user for the caller's own id", async () => {
        mocks.query.mockResolvedValueOnce({
            rows: [{ id: uuid(), user_id: A.userId, name: "S" }],
            rowCount: 1,
        });

        const res = await request(app)
            .get(`/api/networth/${A.userId}`)
            .set(auth());

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        const { sql, params } = lastCall();
        expect(sql).toContain("WHERE user_id = $1");
        expect(params).toEqual([A.userId]);
    });

    it("returns 404, no data, no query for another user's id", async () => {
        const res = await request(app)
            .get(`/api/networth/${B.userId}`)
            .set(auth(A));

        expect(res.status).toBe(404);
        expect(res.body).not.toBeInstanceOf(Array);
        expect(JSON.stringify(res.body)).not.toContain(B.userId);
        expect(mocks.query).not.toHaveBeenCalled();
    });

    it("returns 400 for a malformed userId, with no query", async () => {
        const res = await request(app)
            .get("/api/networth/1;DROP TABLE networth")
            .set(auth());
        expect(res.status).toBe(400);
        expect(mocks.query).not.toHaveBeenCalled();
    });

    it("propagates DB errors as 500, not an empty list", async () => {
        mocks.query.mockRejectedValueOnce(new Error("connection lost"));
        const res = await request(app)
            .get(`/api/networth/${A.userId}`)
            .set(auth());
        expect(res.status).toBe(500);
    });
});

describe("net worth authz: create", () => {
    beforeEach(() => mocks.query.mockReset());

    it("writes user_id from the token, ignoring a body userId", async () => {
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

        const res = await request(app)
            .put("/api/networth/new")
            .set(auth())
            .send({ ...item, _id: uuid(), userId: B.userId });

        expect(res.status).toBe(201);
        const { sql, params } = lastCall();
        expect(sql).toMatch(
            /^INSERT INTO networth \(id, user_id, name, type, value, /
        );
        expect(params[1]).toBe(A.userId);
        expect(params).not.toContain(B.userId);
        expect(params.slice(2)).toEqual([
            "Savings", "asset", 100, "d", "2024-01-15",
        ]);
    });

    it("propagates DB errors as 500", async () => {
        mocks.query.mockRejectedValueOnce(new Error("insert failed"));
        const res = await request(app)
            .put("/api/networth/new")
            .set(auth())
            .send(item);
        expect(res.status).toBe(500);
    });
});

describe("net worth authz: update", () => {
    beforeEach(() => mocks.query.mockReset());

    it("scopes UPDATE by path id and caller; strips _id/userId", async () => {
        const pathId = uuid();
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

        const res = await request(app)
            .patch(`/api/networth/${pathId}`)
            .set(auth())
            .send({ _id: uuid(), userId: B.userId, name: "N", value: 5 });

        expect(res.status).toBe(201);
        const { sql, params } = lastCall();
        expect(sql).toContain("WHERE id = $1 AND user_id = $2");
        expect(sql).toMatch(/^UPDATE networth SET name = \$3, value = \$4/);
        expect(params).toEqual([pathId, A.userId, "N", 5]);
    });

    it("returns 404 for another user's item", async () => {
        const bobsItem = uuid();
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

        const res = await request(app)
            .patch(`/api/networth/${bobsItem}`)
            .set(auth(A))
            .send({ name: "hijack" });

        expect(res.status).toBe(404);
        expect(lastCall().params.slice(0, 2)).toEqual([bobsItem, A.userId]);
    });

    it("returns 400 and runs no query for an empty update", async () => {
        for (const body of [{}, { _id: uuid(), userId: B.userId }]) {
            const res = await request(app)
                .patch(`/api/networth/${uuid()}`)
                .set(auth())
                .send(body);
            expect(res.status).toBe(400);
        }
        expect(mocks.query).not.toHaveBeenCalled();
    });

    it("returns 400 for a malformed id, with no query", async () => {
        const res = await request(app)
            .patch("/api/networth/not-a-uuid")
            .set(auth())
            .send({ name: "x" });
        expect(res.status).toBe(400);
        expect(mocks.query).not.toHaveBeenCalled();
    });
});

describe("net worth authz: delete", () => {
    beforeEach(() => mocks.query.mockReset());

    it("scopes DELETE by id and caller", async () => {
        const id = uuid();
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

        const res = await request(app)
            .delete(`/api/networth/${id}`)
            .set(auth());

        expect(res.status).toBe(200);
        const { sql, params } = lastCall();
        expect(sql).toBe("DELETE FROM networth WHERE id = $1 AND user_id = $2");
        expect(params).toEqual([id, A.userId]);
    });

    it("returns 404 for another user's item", async () => {
        const bobsItem = uuid();
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

        const res = await request(app)
            .delete(`/api/networth/${bobsItem}`)
            .set(auth(A));

        expect(res.status).toBe(404);
        expect(lastCall().params).toEqual([bobsItem, A.userId]);
    });

    it("returns 400 for a malformed id, with no query", async () => {
        const res = await request(app)
            .delete("/api/networth/1;DROP TABLE networth")
            .set(auth());
        expect(res.status).toBe(400);
        expect(mocks.query).not.toHaveBeenCalled();
    });

    it("propagates DB errors as 500", async () => {
        mocks.query.mockRejectedValueOnce(new Error("connection lost"));
        const res = await request(app)
            .delete(`/api/networth/${uuid()}`)
            .set(auth());
        expect(res.status).toBe(500);
    });
});

describe("net worth injection", () => {
    beforeEach(() => mocks.query.mockReset());

    it("rejects unknown keys on create and update with no query", async () => {
        const evil = { ...item, "x = 1; --": 1 };
        const c = await request(app)
            .put("/api/networth/new").set(auth()).send(evil);
        const u = await request(app)
            .patch(`/api/networth/${uuid()}`).set(auth()).send(evil);
        expect(c.status).toBe(400);
        expect(u.status).toBe(400);
        expect(mocks.query).not.toHaveBeenCalled();
    });

    it("rejects an own __proto__ key", async () => {
        const res = await request(app)
            .put("/api/networth/new")
            .set(auth())
            .set("Content-Type", "application/json")
            .send(JSON.stringify(item).replace("{", '{"__proto__":{"x":1},'));
        expect(res.status).toBe(400);
        expect(mocks.query).not.toHaveBeenCalled();
    });
});
