import { mongoClient } from "../mongo.database";
import { Request, Response, NextFunction } from "express";
import { CredentialService } from "../services/credential.service";


const client = mongoClient;
const credentialService = new CredentialService(client);

export async function register(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const {username, email, plainTextPassword, userData} = req.body;
        const status = await credentialService.registerUser(
            username, 
            email, 
            plainTextPassword, 
            userData
        );
        if (!status) {
            res.status(404).json({error: "Unable to create new user"});
            return;
        }
        res.status(200).json({message: "New user created"}); 
    } catch (err) {
        next(err);
    }
}

export async function login(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const {username, password} = req.body;
        const secret = req.app.locals.JWT_SECRET as string;
        const result = await credentialService.verifyPassword(username, password, secret);
        if (!result) {
            res.status(401).json({error: "Unable to create new user"});
            return;
        } else {
            res.json(result)
        } 
    } catch (err) {
        next(err);
    }
}

export async function getUserIdByToken(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userCredId = req.user.id;
        const result = await credentialService.getUserId(userCredId);
        if (!result) {
            res.status(401).json({error: "Unable to create new user"});
            return;
        } else {
            res.json(result)
        } 
    } catch (err) {
        next(err);
    }
}

