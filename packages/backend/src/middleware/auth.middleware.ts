import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


interface IAuthTokenPayLoad {
    id: string;
    username: string;
}

// Module augmentation: extends Express's Request interface
declare module "express-serve-static-core" {
    interface Request {
        user: IAuthTokenPayLoad;
    }
}

export function verifyAuthToken(
    req: Request, 
    res: Response, 
    next: NextFunction) {
        const authHeader = req.get("Authorization") || ""; 
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            // Missing token
            res.status(401).json({message: "No token provided"});
            return;
        }
        // Extract and remove the "Bearer " prefix
        const token = authHeader.slice(7);

        const secret = req.app.locals.JWT_SECRET as string;
        jwt.verify(token, secret, (err, decoded) => {
            if (err || !decoded) {
                res.status(401).json({message: "Invalid or expired token"});
                return;
            }
            req.user = decoded as IAuthTokenPayLoad;

            // Move onto Router
            next();
        });

}

