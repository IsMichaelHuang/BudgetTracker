/**
 * @module netWorth.route
 * @description Express router for net worth CRUD endpoints.
 * All routes are protected by JWT authentication middleware at the parent mount level.
 *
 * **Routes:**
 * | Method | Path       | Handler                    | Description               |
 * |--------|------------|----------------------------|---------------------------|
 * | GET    | /:userId   | {@link getNetWorthByUserId}| Get user's net worth items |
 * | PUT    | /new       | {@link addNetWorth}        | Create a new entry        |
 * | PATCH  | /:id       | {@link updateNetWorthById} | Update an entry           |
 * | DELETE | /:id       | {@link removeNetWorthById} | Delete an entry           |
 */

import { Router } from "express";
import {
    validateBody,
    validateUuidParam,
} from "../middleware/validate.middleware";
import {
    netWorthCreateSchema,
    netWorthUpdateSchema,
} from "../validation/netWorth.schema";
import {
    getNetWorthByUserId,
    addNetWorth,
    updateNetWorthById,
    removeNetWorthById,
} from "../controllers/netWorth.controller";

const netWorthRouter = Router();

netWorthRouter.get(
    "/:userId",
    validateUuidParam("userId"),
    getNetWorthByUserId
);
netWorthRouter.put("/new", validateBody(netWorthCreateSchema), addNetWorth);
netWorthRouter.patch(
    "/:id",
    validateUuidParam("id"),
    validateBody(netWorthUpdateSchema),
    updateNetWorthById
);
netWorthRouter.delete("/:id", validateUuidParam("id"), removeNetWorthById);

export default netWorthRouter;
