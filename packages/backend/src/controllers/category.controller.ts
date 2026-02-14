/**
 * @module category.controller
 * @description Express route handlers for budget category CRUD operations.
 * Each handler validates the service response and returns appropriate HTTP status codes.
 * Delegates business logic to {@link CategoryService}, which handles cascade deletion
 * of associated charges.
 */

import { pool } from "../postgres.database";
import { Request, Response, NextFunction } from "express";
import { CategoryService } from "../services/category.service";

const categoryService = new CategoryService(pool);

/**
 * Updates an existing budget category.
 *
 * The category to update is identified by the `_id` field in the request body.
 * Logs the authenticated username for debugging purposes.
 *
 * @route PATCH /categories/:id
 * @param req - Express request with the full category document in `req.body`.
 * @param res - Returns **201** on success, or **404** if the category was not found or update failed.
 * @param next - Express next function; forwards unexpected errors to the error handler.
 */
export async function updateCategoryById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const body = req.body;
        const user = req.user.username;
        console.log("Hit", user);
        const status = await categoryService.updateCategory(body);

        if (!status) {
            res.status(404).json({error: "Category Update Failed"})
            return;
        }
        res.status(201).json({message: "Category updated"})
    } catch (err) {
        next(err);
    }
}

/**
 * Creates a new budget category.
 *
 * Any client-supplied `_id` is stripped by the service layer to let MongoDB auto-generate one.
 *
 * @route PUT /categories/new
 * @param req - Express request with category data in `req.body`.
 * @param res - Returns **201** on success, or **404** if creation failed.
 * @param next - Express next function; forwards unexpected errors to the error handler.
 */
export async function addCategory(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const body = req.body;
        const status = await categoryService.createCategory(body);

        if (!status) {
            res.status(404).json({error: "Category Creation Failed"})
            return;
        }
        res.status(201).json({message: "Category Created"})
    } catch (err) {
        next(err);
    }
}

/**
 * Deletes a budget category and all charges filed under it.
 *
 * The cascade deletion of associated charges is handled by
 * {@link CategoryService.deleteCategory}.
 *
 * @route DELETE /categories/:id
 * @param req - Express request with category ID in `req.params.id`.
 * @param res - Returns **201** on success, or **404** if the category was not found.
 * @param next - Express next function; forwards unexpected errors to the error handler.
 */
export async function removeCategoryById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const catId = req.params.id;
        const status = await categoryService.deleteCategory(catId);

        if (!status) {
            res.status(404).json({error: "Category Unable to be remove"})
            return;
        }
        res.status(201).json({message: "Category removed"})
    } catch (err) {
        next(err);
    }
}
