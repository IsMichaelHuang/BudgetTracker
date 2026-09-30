import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { verifyAuthToken } from "../middleware/auth.middleware";
import { readJwtSecret } from "../config";
import { testToken } from "./helpers";

const SECRET = process.env.JWT_SECRET!;

function run(token: string) {
    const req: any = {
        get: vi.fn().mockReturnValue(`Bearer ${token}`),
        app: { locals: { JWT_SECRET: SECRET } },
    };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    verifyAuthToken(req, res, next);
    return { req, res, next };
}

function sign(payload: any, opts: jwt.SignOptions = {}) {
    return jwt.sign(payload, SECRET, { expiresIn: "2h", ...opts });
}

const good = () => ({
    id: crypto.randomUUID(),
    username: "u",
    userId: crypto.randomUUID(),
});

describe("verifyAuthToken payload requirements", () => {
    beforeEach(() => vi.clearAllMocks());

    it("accepts a full payload and sets req.user", () => {
        const t = testToken();
        const { req, next } = run(t.token);
        expect(next).toHaveBeenCalled();
        expect(req.user.userId).toBe(t.userId);
        expect(req.user.id).toBe(t.id);
    });

    it("rejects a token without userId", () => {
        const { id, username } = good();
        const { res, next } = run(sign({ id, username }));
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it("rejects a non-UUID userId", () => {
        const { res, next } = run(sign({ ...good(), userId: "abc" }));
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it("rejects non-string id or username", () => {
        for (const bad of [{ id: 5 }, { username: 7 }, { id: {} }]) {
            const { res, next } = run(sign({ ...good(), ...bad }));
            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        }
    });

    it("rejects a string payload", () => {
        const { res, next } = run(jwt.sign("just-a-string", SECRET));
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it("rejects an alg none token", () => {
        const b64 = (o: object) =>
            Buffer.from(JSON.stringify(o)).toString("base64url");
        const token =
            `${b64({ alg: "none", typ: "JWT" })}.${b64(good())}.`;
        const { res, next } = run(token);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it("rejects an HS512 token signed with the right secret", () => {
        const { res, next } = run(sign(good(), { algorithm: "HS512" }));
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it("signs test tokens with HS256", () => {
        const header = jwt.decode(testToken().token, { complete: true });
        expect(header?.header.alg).toBe("HS256");
    });
});

describe("readJwtSecret", () => {
    it("returns a secret of 32 or more chars", () => {
        expect(readJwtSecret({ JWT_SECRET: "x".repeat(32) })).toBe(
            "x".repeat(32)
        );
    });

    it("throws when missing", () => {
        expect(() => readJwtSecret({})).toThrow(/JWT_SECRET/);
    });

    it("throws when shorter than 32 chars", () => {
        expect(() => readJwtSecret({ JWT_SECRET: "x".repeat(31) })).toThrow(
            /32/
        );
    });
});

describe("app boot", () => {
    it("refuses to load with a short JWT_SECRET", async () => {
        vi.resetModules();
        vi.stubEnv("JWT_SECRET", "short");
        vi.doMock("../postgres.database", () => ({
            pool: { query: vi.fn() },
        }));
        await expect(import("../app")).rejects.toThrow(/JWT_SECRET/);
        vi.unstubAllEnvs();
        vi.doUnmock("../postgres.database");
    });
});
