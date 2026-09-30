/**
 * @module auth.middleware
 * @description Express middleware that validates JWT Bearer tokens on protected routes.
 * Decodes the token payload and attaches it to `req.user` for downstream handlers.
 * Uses module augmentation to extend Express's {@link Request} type with the `user` field.
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


/** Shape of the decoded JWT payload attached to authenticated requests. */
interface IAuthTokenPayLoad {
    /** Credential document ObjectId (string form). */
    id: string;
    /** Authenticated user's username. */
    username: string;
    /** The user document id every query is scoped to (UUID). */
    userId: string;
}

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isAuthPayload(v: unknown): v is IAuthTokenPayLoad {
    if (typeof v !== "object" || v === null) return false;
    const p = v as Record<string, unknown>;
    return (
        typeof p.id === "string" &&
        typeof p.username === "string" &&
        typeof p.userId === "string" &&
        UUID_RE.test(p.userId)
    );
}

/**
 * Module augmentation: extends Express's {@link Request} interface so that
 * `req.user` is available with type safety in all downstream handlers.
 */
declare module "express-serve-static-core" {
    interface Request {
        user: IAuthTokenPayLoad;
    }
}

/**
 * Validates the `Authorization: Bearer <token>` header on incoming requests.
 *
 * - Returns **401** if the header is missing or does not start with `"Bearer "`.
 * - Returns **401** if the token is invalid, expired, or signed with a different secret.
 * - On success, attaches the decoded payload to `req.user` and calls `next()`.
 *
 * The JWT secret is read from `req.app.locals.JWT_SECRET`, which is set during
 * application bootstrap in {@link module:app}.
 *
 * @param req - Express request; must include an `Authorization` header.
 * @param res - Express response; used to send 401 errors.
 * @param next - Express next function; called on successful verification.
 */
export function verifyAuthToken(
    req: Request,
    res: Response,
    next: NextFunction) {
        const authHeader = req.get("Authorization") || "";
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            // Missing token
            res.status(401).json({message: "No token provided"});
            return;
        }
        // Extract and remove the "Bearer " prefix
        const token = authHeader.slice(7);

        const secret = req.app.locals.JWT_SECRET as string;
        const opts: jwt.VerifyOptions = { algorithms: ["HS256"] };
        jwt.verify(token, secret, opts, (err, decoded) => {
            if (err || !isAuthPayload(decoded)) {
                res.status(401).json({message: "Invalid or expired token"});
                return;
            }
            req.user = decoded;

            // Move onto Router
            next();
        });
}
