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

function lastCall() {
    const [sql, params] = mocks.query.mock.calls.at(-1)!;
    return { sql: sql as string, params: params as unknown[] };
}

describe("category authz: create", () => {
    beforeEach(() => mocks.query.mockReset());

    it("writes user_id from the token, ignoring a body userId", async () => {
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

        const res = await request(app)
            .put("/api/category/new")
            .set(auth())
            .send({ userId: B.userId, title: "Food", amount: 0, allotment: 9 });

        expect(res.status).toBe(201);
        const { sql, params } = lastCall();
        expect(sql).toMatch(
            /^INSERT INTO categories \(id, user_id, title, allotment\)/
        );
        expect(params[1]).toBe(A.userId);
        expect(params).not.toContain(B.userId);
        expect(params.slice(2)).toEqual(["Food", 9]);
    });

    it("does not write the derived amount column", async () => {
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });
        await request(app)
            .put("/api/category/new")
            .set(auth())
            .send({ title: "Food", amount: 123, allotment: 9 });

        expect(lastCall().sql).not.toContain("amount");
        expect(lastCall().params).not.toContain(123);
    });
});

describe("category authz: update", () => {
    beforeEach(() => mocks.query.mockReset());

    it("scopes UPDATE by path id and caller, not body _id/userId", async () => {
        const pathId = uuid();
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

        const res = await request(app)
            .patch(`/api/category/${pathId}`)
            .set(auth())
            .send({ _id: uuid(), userId: B.userId, title: "T", allotment: 5 });

        expect(res.status).toBe(201);
        const { sql, params } = lastCall();
        expect(sql).toContain("WHERE id = $1 AND user_id = $2");
        expect(sql).toMatch(
            /^UPDATE categories SET title = \$3, allotment = \$4/
        );
        expect(params).toEqual([pathId, A.userId, "T", 5]);
    });

    it("returns 404 when the category belongs to another user", async () => {
        const bobsCategory = uuid();
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

        const res = await request(app)
            .patch(`/api/category/${bobsCategory}`)
            .set(auth(A))
            .send({ title: "hijack" });

        expect(res.status).toBe(404);
        expect(lastCall().params.slice(0, 2)).toEqual([bobsCategory, A.userId]);
    });

    it("returns 400 and runs no query for an empty update", async () => {
        for (const body of [{}, { _id: uuid(), userId: B.userId }]) {
            const res = await request(app)
                .patch(`/api/category/${uuid()}`)
                .set(auth())
                .send(body);
            expect(res.status).toBe(400);
        }
        expect(mocks.query).not.toHaveBeenCalled();
    });

    it("returns 400 for a malformed id, with no query", async () => {
        const res = await request(app)
            .patch("/api/category/not-a-uuid")
            .set(auth())
            .send({ title: "x" });
        expect(res.status).toBe(400);
        expect(mocks.query).not.toHaveBeenCalled();
    });
});

describe("category authz: delete", () => {
    beforeEach(() => mocks.query.mockReset());

    it("scopes DELETE by id and caller", async () => {
        const id = uuid();
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

        const res = await request(app)
            .delete(`/api/category/${id}`)
            .set(auth());

        expect(res.status).toBe(201);
        const { sql, params } = lastCall();
        expect(sql).toBe(
            "DELETE FROM categories WHERE id = $1 AND user_id = $2"
        );
        expect(params).toEqual([id, A.userId]);
    });

    it("returns 404 when the row is not the caller's", async () => {
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
        const res = await request(app)
            .delete(`/api/category/${uuid()}`)
            .set(auth(B));
        expect(res.status).toBe(404);
        expect(lastCall().params[1]).toBe(B.userId);
    });

    it("returns 400 for a malformed id, with no query", async () => {
        const res = await request(app)
            .delete("/api/category/1;DROP TABLE categories")
            .set(auth());
        expect(res.status).toBe(400);
        expect(mocks.query).not.toHaveBeenCalled();
    });
});

describe("category injection and errors", () => {
    beforeEach(() => mocks.query.mockReset());

    it("rejects unknown keys on create and update with no query", async () => {
        const evil = { title: "a", allotment: 1, "x = 1; --": 1 };
        const c = await request(app)
            .put("/api/category/new").set(auth()).send(evil);
        const u = await request(app)
            .patch(`/api/category/${uuid()}`).set(auth()).send(evil);
        expect(c.status).toBe(400);
        expect(u.status).toBe(400);
        expect(mocks.query).not.toHaveBeenCalled();
    });

    it("rejects an own __proto__ key", async () => {
        const res = await request(app)
            .put("/api/category/new")
            .set(auth())
            .set("Content-Type", "application/json")
            .send('{"title":"a","allotment":1,"__proto__":{"x":1}}');
        expect(res.status).toBe(400);
        expect(mocks.query).not.toHaveBeenCalled();
    });

    it("propagates DB errors instead of reporting 404", async () => {
        mocks.query.mockRejectedValueOnce(new Error("connection lost"));
        const res = await request(app)
            .delete(`/api/category/${uuid()}`)
            .set(auth());
        expect(res.status).toBe(500);
    });

    it("maps pg 23503 to 404 and 22P02 to 400", async () => {
        mocks.query.mockRejectedValueOnce({ code: "23503" });
        const fk = await request(app)
            .put("/api/category/new")
            .set(auth())
            .send({ title: "a", allotment: 1 });
        expect(fk.status).toBe(404);

        mocks.query.mockRejectedValueOnce({ code: "22P02" });
        const bad = await request(app)
            .delete(`/api/category/${uuid()}`)
            .set(auth());
        expect(bad.status).toBe(400);
    });
});
