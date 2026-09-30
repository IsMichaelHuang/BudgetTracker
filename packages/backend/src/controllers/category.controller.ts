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
 * The target is the path `:id`, scoped to the token's `userId`; body
 * `_id`/`userId` are stripped by validation and never used.
 *
 * @route PATCH /categories/:id
 * @param req - Express request with the full category document in `req.body`.
 * @param res - Returns **201** on success, or **404** if the category was not found or update failed.
 * @param next - Express next function; forwards unexpected errors to the error handler.
 */
export async function updateCategoryById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const status = await categoryService.updateCategory(
            req.params.id,
            req.user.userId,
            req.body
        );

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
 * The row is created for the token's `userId`; a body `userId` is ignored.
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
        const status = await categoryService.createCategory(
            req.user.userId,
            req.body
        );

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
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const status = await categoryService.deleteCategory(
            req.params.id,
            req.user.userId
        );

        if (!status) {
            res.status(404).json({error: "Category Unable to be remove"})
            return;
        }
        res.status(201).json({message: "Category removed"})
    } catch (err) {
        next(err);
    }
}
