/**
 * @module validate.middleware
 * @description Request validation: body schemas and UUID path params.
 * Invalid input is answered with 400 before any query runs.
 */

import { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodType } from "zod";
import { UUID_RE } from "../validation/common";

/**
 * Parses `req.body` with the schema (schemas are `.strict()`), strips
 * the client-supplied `_id` and `userId`, and replaces `req.body` with
 * the parsed result. Responds 400 on any failure.
 */
export function validateBody(schema: ZodType): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        const body: unknown = req.body;
        const isObject =
            typeof body === "object" && body !== null && !Array.isArray(body);
        const result = isObject ? schema.safeParse(body) : null;
        if (!result || !result.success) {
            const details = result?.error?.issues.map((i) => ({
                path: i.path.join("."),
                message: i.message,
            }));
            res.status(400).json({ error: "Invalid request body", details });
            return;
        }
        const data = { ...(result.data as Record<string, unknown>) };
        delete data._id;
        delete data.userId;
        req.body = data;
        next();
    };
}

/** Responds 400 unless `req.params[name]` is a UUID. */
export function validateUuidParam(name: string): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        const value = req.params[name];
        if (typeof value !== "string" || !UUID_RE.test(value)) {
            res.status(400).json({ error: `Invalid ${name}` });
            return;
        }
        next();
    };
}
