import jwt from "jsonwebtoken";
import crypto from "crypto";

type ExpiresIn = jwt.SignOptions["expiresIn"];

export interface TestTokenOpts {
    id?: string;
    username?: string;
    userId?: string;
    expiresIn?: string | number;
    secret?: string;
}

export interface TestToken {
    token: string;
    id: string;
    username: string;
    userId: string;
}

/**
 * Mints a token with the claims the auth middleware requires
 * (id, username, userId) and returns the ids it used.
 */
export function testToken(opts: TestTokenOpts = {}): TestToken {
    const id = opts.id ?? crypto.randomUUID();
    const username = opts.username ?? "testuser";
    const userId = opts.userId ?? crypto.randomUUID();
    const token = jwt.sign(
        { id, username, userId },
        opts.secret ?? process.env.JWT_SECRET!,
        {
            algorithm: "HS256",
            expiresIn: (opts.expiresIn ?? "2h") as ExpiresIn,
        }
    );
    return { token, id, username, userId };
}
