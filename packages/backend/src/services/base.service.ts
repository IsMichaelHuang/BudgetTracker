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
 * Generic per-user CRUD over one table.
 *
 * The constructor takes the only camelCase-field -> column mapping that
 * may reach SQL text. Every read/write is scoped with `user_id`, which
 * always comes from the caller (the verified token), never from a
 * document. Database errors propagate to the caller.
 *
 * @typeParam T - Document type returned by reads.
 * @typeParam F - Writable field names (keys of the column map).
 */
export class BaseService<T, F extends string = string> {
    constructor(
        protected readonly pool: Pool,
        protected readonly tableName: string,
        protected readonly columns: Readonly<Record<F, string>>
    ) {
        if (!tableName) throw new Error("Missing table name");
    }

    private columnFor(field: string): string {
        if (!Object.hasOwn(this.columns, field)) {
            throw new Error(`Unmapped column for field: ${field}`);
        }
        return (this.columns as Record<string, string>)[field];
    }

    private entries(doc: Partial<Record<F, unknown>>): [string, unknown][] {
        return Object.entries(doc).map(([k, v]) => [this.columnFor(k), v]);
    }

    async create(userId: string, doc: Partial<Record<F, unknown>>) {
        const entries = this.entries(doc);
        const columns = ["id", "user_id", ...entries.map(([c]) => c)];
        const values = [
            crypto.randomUUID(),
            userId,
            ...entries.map(([, v]) => v),
        ];
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

        const result = await this.pool.query(
            `INSERT INTO ${this.tableName} (${columns.join(", ")}) ` +
            `VALUES (${placeholders})`,
            values
        );
        return (result.rowCount ?? 0) > 0;
    }

    async findById(id: string, userId: string): Promise<T | null> {
        const result = await this.pool.query(
            `SELECT * FROM ${this.tableName} WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );
        if (result.rows.length === 0) return null;
        return rowToDoc<T>(result.rows[0]);
    }

    async updateById(
        id: string,
        userId: string,
        fields: Partial<Record<F, unknown>>
    ): Promise<boolean> {
        const entries = this.entries(fields);
        if (entries.length === 0) return false;

        const set = entries.map(([c], i) => `${c} = $${i + 3}`).join(", ");
        const result = await this.pool.query(
            `UPDATE ${this.tableName} SET ${set} ` +
            `WHERE id = $1 AND user_id = $2`,
            [id, userId, ...entries.map(([, v]) => v)]
        );
        return (result.rowCount ?? 0) > 0;
    }

    async deleteById(id: string, userId: string): Promise<boolean> {
        const result = await this.pool.query(
            `DELETE FROM ${this.tableName} WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );
        return (result.rowCount ?? 0) > 0;
    }
}

export { rowToDoc };
