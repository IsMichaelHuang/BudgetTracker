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
const P = String.raw`\$\d+(::uuid)?`;
const EXISTS = new RegExp(
    `EXISTS \\(SELECT 1 FROM categories WHERE id = ${P} AND user_id = ${P}\\)`
);

function lastCall() {
    const [sql, params] = mocks.query.mock.calls.at(-1)!;
    return { sql: sql as string, params: params as unknown[] };
}

const newCharge = (categoryId = uuid()) => ({
    categoryId,
    description: "Lunch",
    amount: 12.5,
    date: "2024-01-15",
});

describe("charge authz: create", () => {
    beforeEach(() => mocks.query.mockReset());

    it("writes user_id from the token, ignoring a body userId", async () => {
        const cat = uuid();
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

        const res = await request(app)
            .put("/api/charge/new")
            .set(auth())
            .send({ ...newCharge(cat), userId: B.userId });

        expect(res.status).toBe(201);
        const { sql, params } = lastCall();
        expect(sql).toMatch(
            /^INSERT INTO charges \(id, user_id, category_id, /
        );
        expect(params[1]).toBe(A.userId);
        expect(params).not.toContain(B.userId);
        expect(params.slice(2)).toEqual([cat, "Lunch", 12.5, "2024-01-15"]);
    });

    it("checks category ownership atomically in the INSERT", async () => {
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });
        await request(app)
            .put("/api/charge/new").set(auth()).send(newCharge());

        const { sql } = lastCall();
        expect(sql).toMatch(/\) SELECT /);
        expect(sql).toMatch(EXISTS);
        expect(mocks.query).toHaveBeenCalledTimes(1);
    });

    it("returns 404 when the category is another user's", async () => {
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
        const bobsCategory = uuid();

        const res = await request(app)
            .put("/api/charge/new")
            .set(auth(A))
            .send(newCharge(bobsCategory));

        expect(res.status).toBe(404);
        expect(lastCall().params).toContain(A.userId);
        expect(lastCall().params).not.toContain(B.userId);
    });

    it("rejects unknown keys with 400 and no query", async () => {
        const res = await request(app)
            .put("/api/charge/new")
            .set(auth())
            .send({ ...newCharge(), "x = 1; --": 1 });
        expect(res.status).toBe(400);
        expect(mocks.query).not.toHaveBeenCalled();
    });

    it("rejects an own __proto__ key with 400", async () => {
        const res = await request(app)
            .put("/api/charge/new")
            .set(auth())
            .set("Content-Type", "application/json")
            .send(
                JSON.stringify(newCharge()).slice(0, -1) +
                ',"__proto__":{"x":1}}'
            );
        expect(res.status).toBe(400);
        expect(mocks.query).not.toHaveBeenCalled();
    });

    it("accepts and strips _id and userId", async () => {
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });
        const bodyId = uuid();
        const res = await request(app)
            .put("/api/charge/new")
            .set(auth())
            .send({ ...newCharge(), _id: bodyId, userId: B.userId });
        expect(res.status).toBe(201);
        expect(lastCall().params).not.toContain(bodyId);
        expect(lastCall().params).not.toContain(B.userId);
    });
});

describe("charge authz: update", () => {
    beforeEach(() => mocks.query.mockReset());

    it("scopes by path id and caller, not body _id/userId", async () => {
        const pathId = uuid();
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

        const res = await request(app)
            .patch(`/api/charge/${pathId}`)
            .set(auth())
            .send({ _id: uuid(), userId: B.userId, description: "x" });

        expect(res.status).toBe(201);
        const { sql, params } = lastCall();
        expect(sql).toBe(
            "UPDATE charges SET description = $3 " +
            "WHERE id = $1 AND user_id = $2"
        );
        expect(params).toEqual([pathId, A.userId, "x"]);
    });

    it("sets only the provided columns", async () => {
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });
        await request(app)
            .patch(`/api/charge/${uuid()}`)
            .set(auth())
            .send({ amount: 5, date: "2024-02-01" });

        const { sql, params } = lastCall();
        expect(sql).toMatch(/^UPDATE charges SET amount = \$3, date = \$4 /);
        expect(sql).not.toContain("description");
        expect(sql).not.toContain("category_id");
        expect(sql).not.toMatch(EXISTS);
        expect(params.slice(2)).toEqual([5, "2024-02-01"]);
    });

    it("adds the category EXISTS predicate when categoryId given", async () => {
        const pathId = uuid();
        const cat = uuid();
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });
        await request(app)
            .patch(`/api/charge/${pathId}`)
            .set(auth())
            .send({ categoryId: cat, amount: 1 });

        const { sql, params } = lastCall();
        expect(sql).toMatch(/SET category_id = \$3, amount = \$4 /);
        expect(sql).toContain("WHERE id = $1 AND user_id = $2 AND EXISTS");
        expect(sql).toMatch(EXISTS);
        expect(sql).toContain("id = $3 AND user_id = $2");
        expect(params).toEqual([pathId, A.userId, cat, 1]);
    });

    it("returns 404 when the charge is another user's", async () => {
        const bobsCharge = uuid();
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
        const res = await request(app)
            .patch(`/api/charge/${bobsCharge}`)
            .set(auth(A))
            .send({ description: "hijack" });
        expect(res.status).toBe(404);
        expect(lastCall().params.slice(0, 2)).toEqual([bobsCharge, A.userId]);
    });

    it("returns 404 when the new category is another user's", async () => {
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
        const res = await request(app)
            .patch(`/api/charge/${uuid()}`)
            .set(auth(A))
            .send({ categoryId: uuid() });
        expect(res.status).toBe(404);
        expect(lastCall().sql).toMatch(EXISTS);
    });

    it("returns 400 and runs no query for an empty update", async () => {
        for (const body of [{}, { _id: uuid(), userId: B.userId }]) {
            const res = await request(app)
                .patch(`/api/charge/${uuid()}`)
                .set(auth())
                .send(body);
            expect(res.status).toBe(400);
        }
        expect(mocks.query).not.toHaveBeenCalled();
    });

    it("returns 400 for a malformed id, with no query", async () => {
        const res = await request(app)
            .patch("/api/charge/not-a-uuid")
            .set(auth())
            .send({ description: "x" });
        expect(res.status).toBe(400);
        expect(mocks.query).not.toHaveBeenCalled();
    });

    it("rejects unknown keys with 400 and no query", async () => {
        const res = await request(app)
            .patch(`/api/charge/${uuid()}`)
            .set(auth())
            .send({ description: "a", "x = 1; --": 1 });
        expect(res.status).toBe(400);
        expect(mocks.query).not.toHaveBeenCalled();
    });

    it("rejects an own __proto__ key with 400", async () => {
        const res = await request(app)
            .patch(`/api/charge/${uuid()}`)
            .set(auth())
            .set("Content-Type", "application/json")
            .send('{"description":"a","__proto__":{"x":1}}');
        expect(res.status).toBe(400);
        expect(mocks.query).not.toHaveBeenCalled();
    });
});

describe("charge authz: delete", () => {
    beforeEach(() => mocks.query.mockReset());

    it("scopes DELETE by id and caller", async () => {
        const id = uuid();
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

        const res = await request(app)
            .delete(`/api/charge/${id}`)
            .set(auth());

        expect(res.status).toBe(200);
        const { sql, params } = lastCall();
        expect(sql).toBe("DELETE FROM charges WHERE id = $1 AND user_id = $2");
        expect(params).toEqual([id, A.userId]);
    });

    it("returns 404 when the charge is not the caller's", async () => {
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
        const res = await request(app)
            .delete(`/api/charge/${uuid()}`)
            .set(auth(B));
        expect(res.status).toBe(404);
        expect(lastCall().params[1]).toBe(B.userId);
    });

    it("returns 400 for a malformed id, with no query", async () => {
        const res = await request(app)
            .delete("/api/charge/1;DROP TABLE charges")
            .set(auth());
        expect(res.status).toBe(400);
        expect(mocks.query).not.toHaveBeenCalled();
    });
});

describe("charge errors", () => {
    beforeEach(() => mocks.query.mockReset());

    it("returns 500, not 404, when the DB fails", async () => {
        const fail = () =>
            mocks.query.mockRejectedValueOnce(new Error("connection lost"));
        fail();
        const c = await request(app)
            .put("/api/charge/new").set(auth()).send(newCharge());
        fail();
        const u = await request(app)
            .patch(`/api/charge/${uuid()}`)
            .set(auth()).send({ amount: 1 });
        fail();
        const d = await request(app)
            .delete(`/api/charge/${uuid()}`).set(auth());
        expect([c.status, u.status, d.status]).toEqual([500, 500, 500]);
    });
});
