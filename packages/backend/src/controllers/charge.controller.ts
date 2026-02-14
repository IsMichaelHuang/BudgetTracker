/**
 * @module charge.controller
 * @description Express route handlers for charge (expense) CRUD operations.
 * Each handler validates the service response and returns appropriate HTTP status codes.
 * Delegates business logic to {@link ChargeService}.
 */

import { mongoClient } from "../mongo.database";
import { Request, Response, NextFunction } from "express";
import { ChargeService } from "../services/charge.service";

/** Shared MongoClient reference used to instantiate the service. */
const client = mongoClient;
/** Singleton service instance created at module load time. */
const chargeService = new ChargeService(client);

/**
 * Updates an existing charge identified by its URL parameter ID.
 *
 * @route PATCH /charges/:id
 * @param req - Express request with charge ID in `req.params.id` and updated fields in `req.body`.
 * @param res - Returns **201** on success, or **404** if the charge was not found or update failed.
 * @param next - Express next function; forwards unexpected errors to the error handler.
 */
export async function updateChargeById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const chargeId = req.params.id;
        const body = req.body;
        const status = await chargeService.updateChargeById(chargeId, body);

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
 * @param req - Express request with charge data in `req.body` (must include `userId` and `categoryId`).
 * @param res - Returns **201** on success, or **404** if creation failed.
 * @param next - Express next function; forwards unexpected errors to the error handler.
 */
export async function addCharge(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const body = req.body;
        const status = await chargeService.createCharge(body);

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
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const chargeId = req.params.id;
        const status = await chargeService.deleteCharge(chargeId);

        if (!status) {
            res.status(404).json({error: "Charge unable to be remove"})
            return;
        }
        res.status(200).json({message: "Charge Deleted"})
    } catch (err) {
        next(err);
    }
}
