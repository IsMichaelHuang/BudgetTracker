import { Router } from "express";
import { register, login, getUserIdByToken } from "../controllers/credential.controller"


const credentialRouter = Router();

credentialRouter.post("/login", login);
credentialRouter.post("/register", register);
credentialRouter.get("/userId", getUserIdByToken)

export default credentialRouter;

