/**
 * @module config
 * @description Reads and validates environment configuration.
 */

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
