/**
 * @module credential.route
 * @description Express router for authentication endpoints.
 * Mounts handlers for user registration, login, and credential-to-user ID lookup.
 *
 * **Routes:**
 * | Method | Path       | Handler              | Auth Required |
 * |--------|------------|----------------------|---------------|
 * | POST   | /login     | {@link login}        | No            |
 * | POST   | /register  | {@link register}     | No            |
 * | GET    | /userId    | {@link getUserIdByToken} | Yes (via parent mount) |
 */

import { Router } from "express";
import { register, login, getUserIdByToken } from "../controllers/credential.controller"


const credentialRouter = Router();

credentialRouter.post("/login", login);
credentialRouter.post("/register", register);
credentialRouter.get("/userId", getUserIdByToken)

export default credentialRouter;
