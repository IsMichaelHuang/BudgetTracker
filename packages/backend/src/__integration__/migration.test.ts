import { describe, it, expect } from "vitest";
import { pool } from "./db";

describe("migration (real Postgres)", () => {
    it("creates every table", async () => {
        const { rows } = await pool.query(
            `SELECT table_name FROM information_schema.tables
             WHERE table_schema = 'public' ORDER BY table_name`
        );
        expect(rows.map((r) => r.table_name)).toEqual([
            "categories",
            "charges",
            "networth",
            "user_credentials",
            "users",
        ]);
    });
});
