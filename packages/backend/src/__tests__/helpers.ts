import jwt from "jsonwebtoken";
import crypto from "crypto";

export function generateTestToken(id?: string, username?: string): string {
    return jwt.sign(
        { id: id ?? crypto.randomUUID(), username: username ?? "testuser" },
        process.env.JWT_SECRET!,
        { expiresIn: "2h" }
    );
}
