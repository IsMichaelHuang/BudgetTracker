/**
 * @module config
 * @description Reads and validates environment configuration.
 */

import path from "path";

const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Returns the JWT signing secret, refusing missing or weak values.
 *
 * @throws If JWT_SECRET is unset or shorter than 32 characters.
 */
export function readJwtSecret(env: NodeJS.ProcessEnv): string {
    const secret = env.JWT_SECRET;
    if (!secret) throw new Error("Error: Missing JWT_SECRET in .env");
    if (secret.length < MIN_JWT_SECRET_LENGTH) {
        throw new Error(
            `Error: JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} chars`
        );
    }
    return secret;
}

/**
 * Returns the absolute directory of the frontend build to serve.
 * Every file in it is public, so it must hold build output only.
 */
export function readStaticDir(env: NodeJS.ProcessEnv): string {
    return env.STATIC_DIR
        ? path.resolve(env.STATIC_DIR)
        : path.resolve(__dirname, "../../frontend/dist");
}
