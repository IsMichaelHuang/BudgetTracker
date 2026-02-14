/**
 * @module summary.route
 * @description Express router for the user dashboard summary endpoint.
 * Protected by JWT authentication middleware at the parent mount level.
 *
 * **Routes:**
 * | Method | Path | Handler                | Description                     |
 * |--------|------|------------------------|---------------------------------|
 * | GET    | /:id | {@link getSummaryById} | Retrieve full financial summary |
 */

import { Router } from "express";
import { getSummaryById } from "../controllers/summary.controller";


const summaryRouter = Router();

summaryRouter.get("/:id", getSummaryById);

export default summaryRouter;
