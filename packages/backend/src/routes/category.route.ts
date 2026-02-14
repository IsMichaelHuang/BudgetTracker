/**
 * @module category.route
 * @description Express router for budget category CRUD endpoints.
 * All routes are protected by JWT authentication middleware at the parent mount level.
 *
 * **Routes:**
 * | Method | Path  | Handler                     | Description              |
 * |--------|-------|-----------------------------|--------------------------|
 * | PATCH  | /:id  | {@link updateCategoryById}  | Update a category        |
 * | DELETE | /:id  | {@link removeCategoryById}  | Delete a category + charges |
 * | PUT    | /new  | {@link addCategory}         | Create a new category    |
 */

import { Router } from "express";
import { updateCategoryById, addCategory, removeCategoryById} from "../controllers/category.controller";


const categoryRouter = Router();

categoryRouter.patch("/:id", updateCategoryById);
categoryRouter.delete("/:id", removeCategoryById);
categoryRouter.put("/new", addCategory);

export default categoryRouter;
