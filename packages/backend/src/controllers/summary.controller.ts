import { mongoClient } from "../mongo.database";
import { Request, Response, NextFunction } from "express";
import { SummaryService } from "../services/summary.service";


const client = mongoClient;
const summaryService = new SummaryService(client);

export async function getSummaryById(
    req: Request, 
    res: Response, 
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.params.id;
        const user = await summaryService.findSummaryById(userId);

        if (!user) {
            res.status(404).json({ error: "User not found."});
            return;
        }
        res.json(user);

    } catch (err) {
        next(err); // skip straight to the error middleware
    }
}

