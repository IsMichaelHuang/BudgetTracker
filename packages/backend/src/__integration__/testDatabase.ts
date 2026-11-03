const REFUSED =
    "TEST_DATABASE_URL refused: it must be a postgres:// URL whose " +
    "database name ends in _test, with no query other than sslmode";

/** Returns the URL if safe to drop tables in; throws without echoing it. */
export function resolveTestDatabaseUrl(
    env: NodeJS.ProcessEnv
): string | undefined {
    const raw = env.TEST_DATABASE_URL;
    if (!raw) return undefined;
    try {
        const url = new URL(raw);
        const ok =
            ["postgres:", "postgresql:"].includes(url.protocol) &&
            [...url.searchParams.keys()].every((k) => k === "sslmode") &&
            decodeURI(url.pathname).endsWith("_test");
        if (ok) return raw;
    } catch {
        // fall through to the fixed refusal
    }
    throw new Error(REFUSED);
}
