import { mongoClient } from "../mongo.database";
import { Request, Response, NextFunction } from "express";
import { ChargeService } from "../services/charge.service";

const client = mongoClient;
const chargeService = new ChargeService(client);

export async function updateChargeById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const chargeId = req.params.id;
        const body = req.body;
        const status = await chargeService.updateChargeById(chargeId, body);
 
        if (!status) {
            res.status(404).json({error: "Charge Update failed"})
            return;
        }
        res.status(201).json({message: "Charge Updated"})
    } catch (err) {
        next(err);
    }
}

export async function addCharge(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const body = req.body;
        const status = await chargeService.createCharge(body);

        if (!status) {
            res.status(404).json({error: "Charge Create Failed"})
            return;
        }
        res.status(201).json({message: "Charge Created"})
    } catch (err) {
        next(err);
    }
}

export async function removeChargeById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const chargeId = req.params.id;
        const status = await chargeService.deleteCharge(chargeId);

        if (!status) {
            res.status(404).json({error: "Charge unable to be remove"})
            return;
        }
        res.status(200).json({message: "Charge Deleted"})
    } catch (err) {
        next(err);
    }
}

