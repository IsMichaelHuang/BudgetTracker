import { Pool } from "pg";
import crypto from "crypto";

/**
 * Maps a snake_case PostgreSQL row to a camelCase object with _id for API compatibility.
 * Convention: SQL column "id" -> "_id", "user_id" -> "userId", etc.
 */
function rowToDoc<T>(row: Record<string, unknown>): T {
    const doc: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
        if (key === "id") {
            doc["_id"] = value;
        } else {
            // snake_case -> camelCase
            const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
            doc[camel] = value;
        }
    }
    return doc as T;
}

/**
 * Maps a camelCase field name to snake_case column name.
 * Special case: "_id" -> "id"
 */
function fieldToColumn(key: string): string {
    if (key === "_id") return "id";
    return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

export class BaseService<T> {
    constructor(
        protected readonly pool: Pool,
        protected readonly tableName: string
    ) {
        if (!tableName) throw new Error("Missing table name");
    }

    async create(doc: Partial<T>): Promise<boolean> {
        const id = crypto.randomUUID();
        const docWithId = { _id: id, ...doc };

        const entries: [string, unknown][] = [];
        for (const [key, value] of Object.entries(docWithId)) {
            entries.push([fieldToColumn(key), value]);
        }

        const columns = entries.map(([col]) => col).join(", ");
        const placeholders = entries.map((_, i) => `$${i + 1}`).join(", ");
        const values = entries.map(([, val]) => val);

        const result = await this.pool.query(
            `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
            values
        );
        return (result.rowCount ?? 0) > 0;
    }

    async findById(id: string): Promise<T | null> {
        const result = await this.pool.query(
            `SELECT * FROM ${this.tableName} WHERE id = $1`,
            [id]
        );
        if (result.rows.length === 0) return null;
        return rowToDoc<T>(result.rows[0]);
    }

    async updateById(id: string, updateFields: Partial<T>): Promise<boolean> {
        const entries: [string, unknown][] = [];
        for (const [key, value] of Object.entries(updateFields as Record<string, unknown>)) {
            if (key === "_id") continue;
            entries.push([fieldToColumn(key), value]);
        }

        if (entries.length === 0) return false;

        const setClauses = entries.map(([col], i) => `${col} = $${i + 2}`).join(", ");
        const values = [id, ...entries.map(([, val]) => val)];

        const result = await this.pool.query(
            `UPDATE ${this.tableName} SET ${setClauses} WHERE id = $1`,
            values
        );
        return (result.rowCount ?? 0) > 0;
    }

    async deleteById(id: string): Promise<boolean> {
        const result = await this.pool.query(
            `DELETE FROM ${this.tableName} WHERE id = $1`,
            [id]
        );
        return (result.rowCount ?? 0) > 0;
    }
}

export { rowToDoc };
