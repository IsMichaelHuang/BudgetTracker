/**
 * @module credential.controller
 * @description Express route handlers for user authentication workflows:
 * registration, login, and credential-to-user ID resolution.
 * Delegates business logic to {@link CredentialService}.
 */

import { pool } from "../postgres.database";
import { Request, Response, NextFunction } from "express";
import { CredentialService } from "../services/credential.service";

const credentialService = new CredentialService(pool);

/**
 * Registers a new user account.
 *
 * Expects a body already validated by `registerSchema`: `username`, `email`,
 * `plainTextPassword`, and `userData` (`totalAmount` is forced to 0).
 *
 * @route POST /auth/register
 * @param req - Express request with registration fields in `req.body`.
 * @param res - Returns **200** with a success message, or **409** on a duplicate
 * username.
 * @param next - Express next function; forwards unexpected errors to the error handler.
 */
export async function register(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const {username, email, plainTextPassword, userData} = req.body;
        const status = await credentialService.registerUser(
            username,
            email,
            plainTextPassword,
            userData
        );
        if (!status) {
            res.status(409).json({error: "Username already exists"});
            return;
        }
        res.status(200).json({message: "New user created"});
    } catch (err) {
        next(err);
    }
}

/**
 * Authenticates a user and returns a signed JWT.
 *
 * Expects a JSON body with `username` and `password`. The JWT secret is read
 * from `req.app.locals.JWT_SECRET`.
 *
 * @route POST /auth/login
 * @param req - Express request with `username` and `password` in `req.body`.
 * @param res - Returns **200** with `{ token }` on success, or **401** if credentials are invalid.
 * @param next - Express next function; forwards unexpected errors to the error handler.
 */
export async function login(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const {username, password} = req.body;
        const secret = req.app.locals.JWT_SECRET as string;
        const result = await credentialService.verifyPassword(username, password, secret);
        if (!result) {
            res.status(401).json({error: "Invalid username or password"});
            return;
        } else {
            res.json(result)
        }
    } catch (err) {
        next(err);
    }
}

/**
 * Returns the authenticated user's id from the verified token claim.
 * No database query is made.
 *
 * @route GET /auth/userId
 * @param req - Express request with `req.user` set by auth middleware.
 * @param res - Returns **200** with `{ userId }`.
 */
export function getUserIdByToken(req: Request, res: Response): void {
    res.json({ userId: req.user.userId });
}
