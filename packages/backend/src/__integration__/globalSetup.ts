/**
 * Starts a throwaway Postgres (unless TEST_DATABASE_URL is set) and
 * applies the schema migration before the integration suite runs.
 */
import fs from "fs";
import os from "os";
import path from "path";
import { Client } from "pg";
import EmbeddedPostgres from "embedded-postgres";
import { resolveTestDatabaseUrl } from "./testDatabase";

const PORT = 54330;
const USER = "bt_test";
const PASSWORD = "bt_test";
const DB = "budget_test";
const MIGRATION = path.resolve(
    __dirname,
    "../../db/migrations/001_create_schema.sql"
);

export default async function setup(): Promise<() => Promise<void>> {
    let embedded: EmbeddedPostgres | undefined;
    let dataDir: string | undefined;
    let url = resolveTestDatabaseUrl(process.env);

    if (!url) {
        dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "bt-pg-"));
        embedded = new EmbeddedPostgres({
            databaseDir: dataDir,
            user: USER,
            password: PASSWORD,
            port: PORT,
            persistent: false,
            onLog: () => {},
        });
        await embedded.initialise();
        await embedded.start();
        await embedded.createDatabase(DB);
        url = `postgres://${USER}:${PASSWORD}@localhost:${PORT}/${DB}`;
    }

    const client = new Client({ connectionString: url });
    await client.connect();
    try {
        await client.query(
            "DROP TABLE IF EXISTS networth, charges, categories, " +
            "user_credentials, users CASCADE"
        );
        await client.query(fs.readFileSync(MIGRATION, "utf8"));
    } finally {
        await client.end();
    }

    return async () => {
        if (embedded) await embedded.stop();
        if (dataDir) fs.rmSync(dataDir, { recursive: true, force: true });
    };
}
