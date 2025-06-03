import { Router } from "express";
import { updateCategoryById, addCategory, removeCategoryById} from "../controllers/category.controller";


const categoryRouter = Router();

categoryRouter.patch("/:id", updateCategoryById);
categoryRouter.delete("/:id", removeCategoryById);
categoryRouter.put("/new", addCategory);

export default categoryRouter;

