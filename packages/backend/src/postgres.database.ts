import { Pool, types } from "pg";

/*
 * pg returns NUMERIC as strings by default. Every NUMERIC column here is
 * NUMERIC(12,2) (max 9,999,999,999.99), well inside the 2^53 range where
 * a JS number keeps every cent, and sums are done in SQL. So parse them
 * to numbers once, for every query, to keep the API's JSON shape the
 * same as it was with MongoDB. This is process-wide on purpose.
 */
types.setTypeParser(types.builtins.NUMERIC, (value: string) => Number(value));

const {
    PG_HOST,
    PG_PORT,
    PG_USER,
    PG_PASSWORD,
    PG_DATABASE,
    DATABASE_URL,
} = process.env;

let pool: Pool;

if (DATABASE_URL) {
    pool = new Pool({ connectionString: DATABASE_URL });
} else {
    const requiredEnvs: [string, string | undefined][] = [
        ["PG_HOST", PG_HOST],
        ["PG_PORT", PG_PORT],
        ["PG_USER", PG_USER],
        ["PG_PASSWORD", PG_PASSWORD],
        ["PG_DATABASE", PG_DATABASE],
    ];

    const missing = requiredEnvs
        .filter(([_, value]) => !value)
        .map(([key]) => key);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variable(s): ${missing.join(", ")}`
        );
    }

    pool = new Pool({
        host: PG_HOST,
        port: Number(PG_PORT),
        user: PG_USER,
        password: PG_PASSWORD,
        database: PG_DATABASE,
    });
}

export { pool };

export async function connectPostgres(): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query("SELECT 1");
        console.log("PostgreSQL connected to database");
    } finally {
        client.release();
    }
}

export async function closePostgres(): Promise<void> {
    await pool.end();
    console.log("PostgreSQL connection pool closed");
}
