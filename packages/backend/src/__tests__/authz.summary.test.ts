import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

const mocks = vi.hoisted(() => {
    const clientQuery = vi.fn();
    const release = vi.fn();
    const poolQuery = vi.fn();
    const connect = vi.fn();
    return { clientQuery, release, poolQuery, connect };
});

vi.mock("../postgres.database", () => ({
    pool: { query: mocks.poolQuery, connect: mocks.connect },
    connectPostgres: vi.fn(),
    closePostgres: vi.fn(),
}));

import request from "supertest";
import app from "../app";
import { testToken } from "./helpers";

const A = testToken({ username: "alice" });
const B = testToken({ username: "bob" });
const auth = () => ({ Authorization: `Bearer ${A.token}` });
const ok = (rows: unknown[] = []) => ({ rows, rowCount: rows.length });

function neverQueried() {
    expect(mocks.connect).not.toHaveBeenCalled();
    expect(mocks.clientQuery).not.toHaveBeenCalled();
    expect(mocks.poolQuery).not.toHaveBeenCalled();
}

describe("summary authz", () => {
    beforeEach(() => {
        mocks.clientQuery.mockReset();
        mocks.release.mockReset();
        mocks.poolQuery.mockReset();
        mocks.connect.mockReset();
        mocks.connect.mockResolvedValue({
            query: mocks.clientQuery,
            release: mocks.release,
        });
    });

    it("returns 404 for another user's id and never queries", async () => {
        const res = await request(app)
            .get(`/api/user/${B.userId}`)
            .set(auth());

        expect(res.status).toBe(404);
        neverQueried();
    });

    it("returns 400 for a malformed UUID and never queries", async () => {
        const res = await request(app)
            .get("/api/user/1; DROP TABLE users")
            .set(auth());

        expect(res.status).toBe(400);
        neverQueried();
    });

    it("returns 200 for own id; all queries use the token userId", async () => {
        const catId = crypto.randomUUID();
        mocks.clientQuery
            .mockResolvedValueOnce(ok()) // BEGIN
            .mockResolvedValueOnce(ok()) // UPDATE categories
            .mockResolvedValueOnce(ok()) // UPDATE users
            .mockResolvedValueOnce(ok([{ id: A.userId, name: "alice" }]))
            .mockResolvedValueOnce(ok([{ id: catId, user_id: A.userId }]))
            .mockResolvedValueOnce(ok()) // charges
            .mockResolvedValueOnce(ok()); // COMMIT
        mocks.poolQuery.mockResolvedValueOnce(ok([{ id: A.id }]));

        const res = await request(app)
            .get(`/api/user/${A.userId}`)
            .set(auth());

        expect(res.status).toBe(200);
        expect(res.body.user.userCred).toBe(A.id);
        const all = [
            ...mocks.clientQuery.mock.calls,
            ...mocks.poolQuery.mock.calls,
        ];
        const scoped = all.filter(
            ([sql]) => sql !== "BEGIN" && sql !== "COMMIT"
        );
        expect(scoped).toHaveLength(6);
        for (const [, params] of scoped) {
            expect(params).toEqual([A.userId]);
        }
        expect(mocks.release).toHaveBeenCalledTimes(1);
        expect(mocks.release).toHaveBeenCalledWith();
    });

    it("rolls back, releases once and returns 500 on a DB error", async () => {
        mocks.clientQuery
            .mockResolvedValueOnce(ok()) // BEGIN
            .mockResolvedValueOnce(ok()) // UPDATE categories
            .mockRejectedValueOnce(new Error("boom")) // UPDATE users
            .mockResolvedValueOnce(ok()); // ROLLBACK

        const res = await request(app)
            .get(`/api/user/${A.userId}`)
            .set(auth());

        expect(res.status).toBe(500);
        const sqls = mocks.clientQuery.mock.calls.map(([s]) => s);
        expect(sqls.filter((s) => s === "ROLLBACK")).toHaveLength(1);
        expect(sqls).not.toContain("COMMIT");
        expect(mocks.release).toHaveBeenCalledTimes(1);
        expect(mocks.release).toHaveBeenCalledWith();
    });

    it("releases with the error when ROLLBACK itself fails", async () => {
        const rollbackErr = new Error("connection lost");
        mocks.clientQuery
            .mockResolvedValueOnce(ok()) // BEGIN
            .mockRejectedValueOnce(new Error("boom")) // UPDATE categories
            .mockRejectedValueOnce(rollbackErr); // ROLLBACK

        const res = await request(app)
            .get(`/api/user/${A.userId}`)
            .set(auth());

        expect(res.status).toBe(500);
        expect(mocks.release).toHaveBeenCalledTimes(1);
        expect(mocks.release).toHaveBeenCalledWith(rollbackErr);
    });

    it("returns 404 and rolls back when the user row is gone", async () => {
        mocks.clientQuery
            .mockResolvedValueOnce(ok()) // BEGIN
            .mockResolvedValueOnce(ok()) // UPDATE categories
            .mockResolvedValueOnce(ok()) // UPDATE users
            .mockResolvedValueOnce(ok()) // SELECT users: none
            .mockResolvedValueOnce(ok()); // ROLLBACK

        const res = await request(app)
            .get(`/api/user/${A.userId}`)
            .set(auth());

        expect(res.status).toBe(404);
        expect(mocks.clientQuery.mock.calls.at(-1)![0]).toBe("ROLLBACK");
        expect(mocks.release).toHaveBeenCalledTimes(1);
    });
});
