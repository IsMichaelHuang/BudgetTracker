/**
 * @module error.middleware
 * @description Last-resort error handler. Always answers with JSON and
 * never sends a stack trace or error message to the client.
 * Body-parser errors map to 400 (malformed JSON) and 413 (too large);
 * everything else is logged server-side and answered with 500.
 */

import { Request, Response, NextFunction } from "express";

export function handleErrors(
    err: unknown,
    _req: Request,
    res: Response,
    next: NextFunction
): void {
    if (res.headersSent) {
        next(err);
        return;
    }
    const type = (err as { type?: unknown } | null)?.type;
    if (type === "entity.parse.failed") {
        res.status(400).json({ error: "Malformed JSON body" });
        return;
    }
    if (type === "entity.too.large") {
        res.status(413).json({ error: "Request body too large" });
        return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
}
