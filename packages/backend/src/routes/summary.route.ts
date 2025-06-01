import { Router } from "express";
import { getSummaryById } from "../controllers/summary.controller";


const summaryRouter = Router();

summaryRouter.get("/:id", getSummaryById);

export default summaryRouter;

