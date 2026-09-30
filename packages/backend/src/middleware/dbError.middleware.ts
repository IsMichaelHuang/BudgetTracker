/**
 * @module dbError.middleware
 * @description Maps known PostgreSQL errors to HTTP statuses.
 * 22P02 (invalid text representation) -> 400,
 * 23503 (foreign key violation) -> 404. Others go to the next handler.
 */

import { Request, Response, NextFunction } from "express";

export function mapDbErrors(
    err: unknown,
    _req: Request,
    res: Response,
    next: NextFunction
): void {
    const code = (err as { code?: unknown } | null)?.code;
    if (code === "22P02") {
        res.status(400).json({ error: "Invalid input" });
        return;
    }
    if (code === "23503") {
        res.status(404).json({ error: "Not found" });
        return;
    }
    next(err);
}
