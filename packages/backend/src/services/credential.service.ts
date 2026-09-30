import { Pool } from "pg";
import crypto from "crypto";
import type { UserDocument } from "types/user.type";
import type { CredentialDocument } from "types/credential.type";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { rowToDoc } from "./base.service";

interface UserDataProp {
    totalAmount: number;
    totalAllotment: number;
}

function generateAuthToken(
    id: string,
    username: string,
    userId: string,
    jwtSecret: string
): Promise<string> {
    return new Promise((resolve, reject) => {
        const payload = {id, username, userId};

        jwt.sign(
            payload,
            jwtSecret,
            {algorithm: "HS256", expiresIn: "2h"},
            (err, token) => {
                if (err || !token) {
                    reject(err ?? new Error("Failed to sign token"));
                } else {
                    resolve(token);
                }
            }
        );
    });
}

const USERNAME_UNIQUE = "user_credentials_username_key";

/** Valid bcrypt hash (cost 10) compared against when the user is unknown. */
const DUMMY_HASH =
    "$2b$10$TXHD4yTZM9JeJIWL8hnGM.BC2jv6mJVc547q.11Ke4t1qvSAVKGaG";

export class CredentialService {
    constructor(private readonly pool: Pool) {}

    /**
     * Creates the user and credential rows in one transaction.
     * Returns false when the username is already taken (UNIQUE
     * violation); every other error propagates.
     */
    async registerUser(
        username: string,
        email: string,
        plainTextPassword: string,
        userData: UserDataProp
    ): Promise<boolean> {
        const {totalAmount, totalAllotment} = userData;

        // Hash before holding a pooled connection.
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(plainTextPassword, salt);
        const userId = crypto.randomUUID();
        const credId = crypto.randomUUID();

        const client = await this.pool.connect();
        let releaseErr: Error | undefined;
        try {
            await client.query("BEGIN");
            await client.query(
                `INSERT INTO users
                 (id, name, total_amount, total_allotment)
                 VALUES ($1, $2, $3, $4)`,
                [userId, username, totalAmount, totalAllotment]
            );
            await client.query(
                `INSERT INTO user_credentials
                 (id, username, email, hashed_password, user_id)
                 VALUES ($1, $2, $3, $4, $5)`,
                [credId, username, email, hash, userId]
            );
            await client.query("COMMIT");
            return true;
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackErr) {
                releaseErr = rollbackErr as Error;
            }
            const e = err as {code?: string; constraint?: string};
            if (e.code === "23505" && e.constraint === USERNAME_UNIQUE) {
                return false;
            }
            throw err;
        } finally {
            client.release(releaseErr);
        }
    }

    async verifyPassword(
        username: string,
        plainTextPassword: string,
        secret: string
    ): Promise<{token: string} | null> {
        const result = await this.pool.query(
            `SELECT id, username, hashed_password, user_id FROM user_credentials WHERE username = $1`,
            [username]
        );
        const user = result.rows[0];

        // Unknown users still pay for one compare to equalise timing.
        const match = await bcrypt.compare(
            plainTextPassword,
            user ? user.hashed_password : DUMMY_HASH
        );
        if (!user || !match) return null;

        const token = await generateAuthToken(
            user.id,
            username,
            user.user_id,
            secret
        );
        return { token };
    }
}
