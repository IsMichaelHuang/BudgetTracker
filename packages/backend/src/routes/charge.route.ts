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
import { updateChargeById, addCharge, removeChargeById} from "../controllers/charge.controller";

const chargeRouter = Router();

chargeRouter.patch("/:id", updateChargeById);
chargeRouter.delete("/:id", removeChargeById);
chargeRouter.put("/new", addCharge);



export default chargeRouter;
