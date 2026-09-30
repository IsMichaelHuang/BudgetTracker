/**
 * @module charge.route
 * @description Express router for charge (expense) CRUD endpoints.
 * All routes are protected by JWT authentication middleware at the parent mount level.
 *
 * **Routes:**
 * | Method | Path  | Handler                  | Description          |
 * |--------|-------|--------------------------|----------------------|
 * | PATCH  | /:id  | {@link updateChargeById} | Update a charge      |
 * | DELETE | /:id  | {@link removeChargeById} | Delete a charge      |
 * | PUT    | /new  | {@link addCharge}        | Create a new charge  |
 */

import { Router } from "express";
import {
    validateBody,
    validateUuidParam,
} from "../middleware/validate.middleware";
import {
    chargeCreateSchema,
    chargeUpdateSchema,
} from "../validation/charge.schema";
import { updateChargeById, addCharge, removeChargeById} from "../controllers/charge.controller";

const chargeRouter = Router();

chargeRouter.patch(
    "/:id",
    validateUuidParam("id"),
    validateBody(chargeUpdateSchema),
    updateChargeById
);
chargeRouter.delete("/:id", validateUuidParam("id"), removeChargeById);
chargeRouter.put("/new", validateBody(chargeCreateSchema), addCharge);

export default chargeRouter;
