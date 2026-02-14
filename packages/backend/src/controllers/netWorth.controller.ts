/**
 * @module netWorth.controller
 * @description Express route handlers for net worth CRUD operations.
 * Each handler validates the service response and returns appropriate HTTP status codes.
 * Delegates business logic to {@link NetWorthService}.
 */

import { pool } from "../postgres.database";
import { Request, Response, NextFunction } from "express";
import { NetWorthService } from "../services/netWorth.service";

const netWorthService = new NetWorthService(pool);

/**
 * Retrieves all net worth entries for a given user.
 *
 * @route GET /networth/:userId
 * @param req - Express request with user ID in `req.params.userId`.
 * @param res - Returns **200** with array of net worth entries.
 * @param next - Express next function; forwards unexpected errors to the error handler.
 */
export async function getNetWorthByUserId(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.params.userId;
        const items = await netWorthService.findByUserId(userId);
        res.status(200).json(items);
    } catch (err) {
        next(err);
    }
}

/**
 * Creates a new net worth entry.
 *
 * @route PUT /networth/new
 * @param req - Express request with net worth data in `req.body`.
 * @param res - Returns **201** on success, or **404** if creation failed.
 * @param next - Express next function; forwards unexpected errors to the error handler.
 */
export async function addNetWorth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const body = req.body;
        const status = await netWorthService.createNetWorth(body);

        if (!status) {
            res.status(404).json({error: "Net Worth Create Failed"})
            return;
        }
        res.status(201).json({message: "Net Worth Created"})
    } catch (err) {
        next(err);
    }
}

/**
 * Updates an existing net worth entry identified by its URL parameter ID.
 *
 * @route PATCH /networth/:id
 * @param req - Express request with entry ID in `req.params.id` and updated fields in `req.body`.
 * @param res - Returns **201** on success, or **404** if the entry was not found or update failed.
 * @param next - Express next function; forwards unexpected errors to the error handler.
 */
export async function updateNetWorthById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id;
        const body = req.body;
        const status = await netWorthService.updateNetWorth(id, body);

        if (!status) {
            res.status(404).json({error: "Net Worth Update failed"})
            return;
        }
        res.status(201).json({message: "Net Worth Updated"})
    } catch (err) {
        next(err);
    }
}

/**
 * Deletes a single net worth entry by its URL parameter ID.
 *
 * @route DELETE /networth/:id
 * @param req - Express request with entry ID in `req.params.id`.
 * @param res - Returns **200** on success, or **404** if the entry was not found.
 * @param next - Express next function; forwards unexpected errors to the error handler.
 */
export async function removeNetWorthById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id;
        const status = await netWorthService.deleteNetWorth(id);

        if (!status) {
            res.status(404).json({error: "Net Worth unable to be removed"})
            return;
        }
        res.status(200).json({message: "Net Worth Deleted"})
    } catch (err) {
        next(err);
    }
}
