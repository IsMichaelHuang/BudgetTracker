import { Router } from "express";
import { updateChargeById, addCharge, removeChargeById} from "../controllers/charge.controller";

const chargeRouter = Router();

chargeRouter.patch("/:id", updateChargeById);
chargeRouter.delete("/:id", removeChargeById);
chargeRouter.put("/new", addCharge);



export default chargeRouter;

