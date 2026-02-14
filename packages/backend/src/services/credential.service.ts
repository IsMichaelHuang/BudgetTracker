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
    jwtSecret: string
): Promise<string> {
    return new Promise((resolve, reject) => {
        const payload = {id, username};

        jwt.sign(
            payload,
            jwtSecret,
            {expiresIn: "2h"},
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

export class CredentialService {
    constructor(private readonly pool: Pool) {}

    async registerUser(
        username: string,
        email: string,
        plainTextPassword: string,
        userData: UserDataProp
    ): Promise<boolean> {
        const {totalAmount, totalAllotment} = userData;

        // Check for existing username
        const exist = await this.pool.query(
            `SELECT id FROM user_credentials WHERE username = $1`,
            [username]
        );
        if (exist.rows.length > 0) {
            return false;
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(plainTextPassword, salt);

        console.log(username, plainTextPassword);

        // Create user first (needed for FK reference)
        const userId = crypto.randomUUID();
        await this.pool.query(
            `INSERT INTO users (id, name, total_amount, total_allotment) VALUES ($1, $2, $3, $4)`,
            [userId, username, totalAmount, totalAllotment]
        );

        // Create credential linked to user
        const credId = crypto.randomUUID();
        await this.pool.query(
            `INSERT INTO user_credentials (id, username, email, hashed_password, user_id) VALUES ($1, $2, $3, $4, $5)`,
            [credId, username, email, hash, userId]
        );

        return true;
    }

    async verifyPassword(
        username: string,
        plainTextPassword: string,
        secret: string
    ): Promise<{token: string} | null> {
        const result = await this.pool.query(
            `SELECT id, username, hashed_password FROM user_credentials WHERE username = $1`,
            [username]
        );
        const user = result.rows[0];
        if (!user) return null;

        const match = await bcrypt.compare(plainTextPassword, user.hashed_password);
        if (!match) return null;

        const token = await generateAuthToken(user.id, username, secret);
        return { token };
    }

    async getUserId(userCredId: string): Promise<{userId: string}> {
        const result = await this.pool.query(
            `SELECT user_id FROM user_credentials WHERE id = $1`,
            [userCredId]
        );
        const row = result.rows[0];
        if (!row) throw new Error("Unable to find user from userCred Id");

        return { userId: row.user_id };
    }
}
