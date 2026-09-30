import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

const mocks = vi.hoisted(() => ({
    query: vi.fn(),
    connect: vi.fn(),
    cQuery: vi.fn(),
    release: vi.fn(),
}));

vi.mock("../postgres.database", () => ({
    pool: { query: mocks.query, connect: mocks.connect },
    connectPostgres: vi.fn(),
    closePostgres: vi.fn(),
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
import bcrypt from "bcrypt";
import app from "../app";

const URL = "/api/public/register";
const valid = {
    username: "newuser",
    email: "new@test.com",
    plainTextPassword: "password123",
    userData: { totalAmount: 0, totalAllotment: 1000 },
};

function pgError(code: string, constraint?: string) {
    return Object.assign(new Error("pg error"), { code, constraint });
}

function sqls(): string[] {
    return mocks.cQuery.mock.calls.map((c) => String(c[0]));
}

beforeEach(() => {
    vi.clearAllMocks();
    mocks.query.mockReset();
    mocks.cQuery.mockReset().mockResolvedValue({ rows: [], rowCount: 1 });
    mocks.release.mockReset();
    mocks.connect.mockReset().mockResolvedValue({
        query: mocks.cQuery,
        release: mocks.release,
    });
});

describe("register validation", () => {
    const cases: [string, unknown][] = [
        ["bad email", { ...valid, email: "not-an-email" }],
        ["7 char password", { ...valid, plainTextPassword: "1234567" }],
        ["73 char password", { ...valid, plainTextPassword: "a".repeat(73) }],
        ["missing userData", { ...valid, userData: undefined }],
        [
            "negative totalAllotment",
            { ...valid, userData: { totalAmount: 0, totalAllotment: -1 } },
        ],
        ["unknown key", { ...valid, admin: true }],
    ];

    it.each(cases)("%s -> 400 without connecting", async (_n, body) => {
        const res = await request(app).post(URL).send(body as object);
        expect(res.status).toBe(400);
        expect(mocks.connect).not.toHaveBeenCalled();
        expect(mocks.query).not.toHaveBeenCalled();
    });

    it("accepts an 8 char and a 72 char password", async () => {
        for (const pw of ["12345678", "a".repeat(72)]) {
            const res = await request(app)
                .post(URL)
                .send({ ...valid, plainTextPassword: pw });
            expect(res.status).toBe(200);
        }
    });
});

describe("register transaction", () => {
    it("runs BEGIN, user, credential, COMMIT and releases once", async () => {
        const res = await request(app).post(URL).send(valid);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("New user created");
        const s = sqls();
        expect(s).toHaveLength(4);
        expect(s[0]).toBe("BEGIN");
        expect(s[1]).toMatch(/INSERT INTO users/);
        expect(s[2]).toMatch(/INSERT INTO user_credentials/);
        expect(s[3]).toBe("COMMIT");
        expect(mocks.release).toHaveBeenCalledTimes(1);
        expect(mocks.release.mock.calls[0][0]).toBeUndefined();
        expect(mocks.query).not.toHaveBeenCalled();
    });

    it("forces totalAmount to 0 whatever the body says", async () => {
        const body = {
            ...valid,
            userData: { totalAmount: 500, totalAllotment: 1000 },
        };
        const res = await request(app).post(URL).send(body);

        expect(res.status).toBe(200);
        const params = mocks.cQuery.mock.calls[1][1] as unknown[];
        expect(params[2]).toBe(0);
        expect(params[3]).toBe(1000);
    });

    it("hashes before acquiring a client", async () => {
        await request(app).post(URL).send(valid);
        const hashOrder = (bcrypt.hash as any).mock.invocationCallOrder[0];
        expect(hashOrder).toBeLessThan(
            mocks.connect.mock.invocationCallOrder[0]
        );
    });

    it("rolls back, never commits, releases once on failure", async () => {
        mocks.cQuery
            .mockResolvedValueOnce({}) // BEGIN
            .mockResolvedValueOnce({}) // user
            .mockRejectedValueOnce(new Error("boom")); // credential

        const res = await request(app).post(URL).send(valid);

        expect(res.status).toBe(500);
        const s = sqls();
        expect(s).toContain("ROLLBACK");
        expect(s).not.toContain("COMMIT");
        expect(s[s.length - 1]).toBe("ROLLBACK");
        expect(mocks.release).toHaveBeenCalledTimes(1);
        expect(mocks.release.mock.calls[0][0]).toBeUndefined();
    });

    it("releases with the error when ROLLBACK fails", async () => {
        const rollbackErr = new Error("rollback failed");
        mocks.cQuery
            .mockResolvedValueOnce({}) // BEGIN
            .mockRejectedValueOnce(new Error("boom")) // user insert
            .mockRejectedValueOnce(rollbackErr); // ROLLBACK

        const res = await request(app).post(URL).send(valid);

        expect(res.status).toBe(500);
        expect(mocks.release).toHaveBeenCalledTimes(1);
        expect(mocks.release).toHaveBeenCalledWith(rollbackErr);
    });

    it("409 on 23505 for the username constraint", async () => {
        mocks.cQuery
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({})
            .mockRejectedValueOnce(
                pgError("23505", "user_credentials_username_key")
            );

        const res = await request(app).post(URL).send(valid);

        expect(res.status).toBe(409);
        expect(sqls()).toContain("ROLLBACK");
        expect(sqls()).not.toContain("COMMIT");
        expect(mocks.release).toHaveBeenCalledTimes(1);
    });

    it("500 on 23505 for any other constraint", async () => {
        mocks.cQuery
            .mockResolvedValueOnce({})
            .mockRejectedValueOnce(pgError("23505", "users_pkey"));

        const res = await request(app).post(URL).send(valid);

        expect(res.status).toBe(500);
        expect(mocks.release).toHaveBeenCalledTimes(1);
    });

    it("500 when the connection cannot be acquired", async () => {
        mocks.connect.mockRejectedValueOnce(new Error("no connections"));
        const res = await request(app).post(URL).send(valid);
        expect(res.status).toBe(500);
        expect(mocks.release).not.toHaveBeenCalled();
    });
});

describe("login failures", () => {
    const LOGIN = "/api/public/login";

    it("unknown user gets one compare, same 401", async () => {
        mocks.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
        (bcrypt.compare as any).mockClear();

        const unknown = await request(app)
            .post(LOGIN)
            .send({ username: "ghost", password: "password123" });

        expect(unknown.status).toBe(401);
        expect(bcrypt.compare).toHaveBeenCalledTimes(1);
        const hashArg = (bcrypt.compare as any).mock.calls[0][1];
        expect(hashArg).toMatch(/^\$2[aby]\$\d\d\$.{53}$/);

        mocks.query.mockResolvedValueOnce({
            rows: [
                {
                    id: crypto.randomUUID(),
                    username: "testuser",
                    hashed_password: "$2b$10$hashedpassword",
                    user_id: crypto.randomUUID(),
                },
            ],
            rowCount: 1,
        });
        (bcrypt.compare as any).mockResolvedValueOnce(false);
        const wrong = await request(app)
            .post(LOGIN)
            .send({ username: "testuser", password: "nope" });

        expect(wrong.status).toBe(401);
        expect(wrong.body).toEqual(unknown.body);
        expect(unknown.body.error).not.toMatch(/create new user/i);
    });
});
