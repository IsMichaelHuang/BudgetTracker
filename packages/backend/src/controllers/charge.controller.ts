/**
 * @module charge.controller
 * @description Express route handlers for charge (expense) CRUD operations.
 * Each handler validates the service response and returns appropriate HTTP status codes.
 * Delegates business logic to {@link ChargeService}.
 */

import { pool } from "../postgres.database";
import { Request, Response, NextFunction } from "express";
import { ChargeService } from "../services/charge.service";

const chargeService = new ChargeService(pool);

/**
 * Updates an existing charge identified by its URL parameter ID.
 *
 * @route PATCH /charges/:id
 * The target is the path id, scoped to the token's `userId`; body
 * `_id`/`userId` are stripped by validation and never used. A provided
 * `categoryId` must belong to the caller.
 * @param req - Request with the charge ID in `req.params.id` and the
 * fields to change in `req.body`.
 * @param res - Returns **201** on success, or **404** if the charge was not found or update failed.
 * @param next - Express next function; forwards unexpected errors to the error handler.
 */
export async function updateChargeById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const status = await chargeService.updateChargeById(
            req.params.id,
            req.user.userId,
            req.body
        );

        if (!status) {
            res.status(404).json({error: "Charge Update failed"})
            return;
        }
        res.status(201).json({message: "Charge Updated"})
    } catch (err) {
        next(err);
    }
}

/**
 * Creates a new charge document.
 *
 * @route PUT /charges/new
 * The row is created for the token's `userId`; `categoryId` must
 * belong to the caller.
 * @param req - Express request with charge data in `req.body`.
 * @param res - Returns **201** on success, or **404** if the category is
 * not the caller's.
 * @param next - Express next function; forwards unexpected errors to the error handler.
 */
export async function addCharge(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const status = await chargeService.createCharge(
            req.user.userId,
            req.body
        );

        if (!status) {
            res.status(404).json({error: "Charge Create Failed"})
            return;
        }
        res.status(201).json({message: "Charge Created"})
    } catch (err) {
        next(err);
    }
}

/**
 * Deletes a single charge by its URL parameter ID.
 *
 * @route DELETE /charges/:id
 * @param req - Express request with charge ID in `req.params.id`.
 * @param res - Returns **200** on success, or **404** if the charge was not found.
 * @param next - Express next function; forwards unexpected errors to the error handler.
 */
export async function removeChargeById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const status = await chargeService.deleteCharge(
            req.params.id,
            req.user.userId
        );

        if (!status) {
            res.status(404).json({error: "Charge unable to be remove"})
            return;
        }
        res.status(200).json({message: "Charge Deleted"})
    } catch (err) {
        next(err);
    }
}
