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
import { getNetWorthByUserId, addNetWorth, updateNetWorthById, removeNetWorthById } from "../controllers/netWorth.controller";

const netWorthRouter = Router();

netWorthRouter.get("/:userId", getNetWorthByUserId);
netWorthRouter.put("/new", addNetWorth);
netWorthRouter.patch("/:id", updateNetWorthById);
netWorthRouter.delete("/:id", removeNetWorthById);

export default netWorthRouter;
