import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import crypto from "crypto";
import {
    validateBody,
    validateUuidParam,
} from "../middleware/validate.middleware";
import { mapDbErrors } from "../middleware/dbError.middleware";

function mk(body?: unknown, params: Record<string, string> = {}) {
    const req: any = { body, params };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    return { req, res, next: vi.fn() };
}

const schema = z
    .object({
        _id: z.unknown().optional(),
        userId: z.unknown().optional(),
        title: z.string(),
    })
    .strict();

describe("validateBody", () => {
    it("parses, strips _id and userId, and calls next", () => {
        const { req, res, next } = mk({ _id: "x", userId: "y", title: "t" });
        validateBody(schema)(req, res, next);
        expect(req.body).toEqual({ title: "t" });
        expect(Object.keys(req.body)).toEqual(["title"]);
        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
    });

    it("returns 400 for an invalid body and does not call next", () => {
        const { req, res, next } = mk({ title: 5 });
        validateBody(schema)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    it("returns 400 for unknown keys", () => {
        const { req, res, next } = mk({ title: "t", "a = 1; --": 1 });
        validateBody(schema)(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    it("returns 400 for non-object bodies", () => {
        for (const body of [undefined, null, [], "s", 4]) {
            const { req, res, next } = mk(body);
            validateBody(schema)(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(next).not.toHaveBeenCalled();
        }
    });
});

describe("validateUuidParam", () => {
    it("passes a UUID", () => {
        const { req, res, next } = mk({}, { id: crypto.randomUUID() });
        validateUuidParam("id")(req, res, next);
        expect(next).toHaveBeenCalledWith();
    });

    it("returns 400 for malformed or missing values", () => {
        for (const id of ["abc", "1; DROP TABLE x", ""]) {
            const { req, res, next } = mk({}, { id });
            validateUuidParam("id")(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(next).not.toHaveBeenCalled();
        }
        const { req, res, next } = mk({}, {});
        validateUuidParam("id")(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

describe("mapDbErrors", () => {
    const run = (err: unknown) => {
        const { req, res, next } = mk();
        mapDbErrors(err, req, res, next);
        return { res, next };
    };

    it("maps 22P02 to 400", () => {
        const { res, next } = run({ code: "22P02" });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
    });

    it("maps 23503 to 404", () => {
        const { res, next } = run({ code: "23503" });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(next).not.toHaveBeenCalled();
    });

    it("passes everything else on", () => {
        for (const err of [{ code: "23505" }, new Error("boom"), "x", null]) {
            const { res, next } = run(err);
            expect(next).toHaveBeenCalledWith(err);
            expect(res.status).not.toHaveBeenCalled();
        }
    });
});
