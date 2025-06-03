import { mongoClient } from "../mongo.database";
import { Request, Response, NextFunction } from "express";
import { CategoryService } from "../services/category.service";


const client = mongoClient;
const categoryService = new CategoryService(client);

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

