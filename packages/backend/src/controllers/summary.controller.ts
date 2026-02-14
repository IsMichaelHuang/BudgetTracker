/**
 * @module summary.controller
 * @description Express route handler for the user dashboard summary endpoint.
 * Returns a complete financial overview by delegating to {@link SummaryService},
 * which aggregates data across users, categories, and charges collections.
 */

import { mongoClient } from "../mongo.database";
import { Request, Response, NextFunction } from "express";
import { SummaryService } from "../services/summary.service";


/** Shared MongoClient reference used to instantiate the service. */
const client = mongoClient;
/** Singleton service instance created at module load time. */
const summaryService = new SummaryService(client);

/**
 * Retrieves a full financial summary for a user, including their profile,
 * all categories (with recalculated amounts), and all charges.
 *
 * The summary service performs a multi-step pipeline:
 * 1. Aggregates charge totals by category
 * 2. Updates category amounts
 * 3. Recalculates the user's total spending
 * 4. Returns the assembled summary document
 *
 * @route GET /summary/:id
 * @param req - Express request with user ID in `req.params.id`.
 * @param res - Returns **200** with the {@link SummaryDocument}, or **404** if the user was not found.
 * @param next - Express next function; forwards unexpected errors to the error handler.
 */
export async function getSummaryById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.params.id;
        const user = await summaryService.findSummaryById(userId);

        if (!user) {
            res.status(404).json({ error: "User not found."});
            return;
        }
        res.json(user);

    } catch (err) {
        next(err); // skip straight to the error middleware
    }
}
