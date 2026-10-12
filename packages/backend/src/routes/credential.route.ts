/**
 * @module credential.route
 * @description Express routers for authentication endpoints.
 *
 * **publicAuthRouter** (mounted at /api/public/, no auth):
 * | Method | Path       | Handler          |
 * |--------|------------|------------------|
 * | POST   | /login     | {@link login}    |
 * | POST   | /register  | {@link register} |
 *
 * **authRouter** (mounted at /api/auth/, after token verification):
 * | Method | Path    | Handler                  |
 * |--------|---------|--------------------------|
 * | GET    | /userId | {@link getUserIdByToken} |
 */

import { Router } from "express";
import {
    register,
    login,
    getUserIdByToken,
} from "../controllers/credential.controller";
import { validateBody } from "../middleware/validate.middleware";
import { loginSchema, registerSchema } from "../validation/auth.schema";

export const publicAuthRouter = Router();
publicAuthRouter.post("/login", validateBody(loginSchema), login);
publicAuthRouter.post("/register", validateBody(registerSchema), register);

export const authRouter = Router();
authRouter.get("/userId", getUserIdByToken);
