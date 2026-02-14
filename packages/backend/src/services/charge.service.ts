import { Pool } from "pg";
import crypto from "crypto";
import type { ChargeDocument } from "types/charge.type";

export class ChargeService {
    constructor(private readonly pool: Pool) {}

    async updateChargeById(id: string, body: ChargeDocument): Promise<boolean> {
        try {
            const {_id, userId, categoryId, ...fieldsToUpdate} = body;

            const entries: [string, unknown][] = [
                ["category_id", categoryId],
            ];
            for (const [key, value] of Object.entries(fieldsToUpdate)) {
                const snake = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
                entries.push([snake, value]);
            }

            const setClauses = entries.map(([col], i) => `${col} = $${i + 3}`).join(", ");
            const values = [id, userId, ...entries.map(([, val]) => val)];

            const result = await this.pool.query(
                `UPDATE charges SET ${setClauses} WHERE id = $1 AND user_id = $2`,
                values
            );
            return (result.rowCount ?? 0) > 0;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    async createCharge(body: ChargeDocument): Promise<boolean> {
        try {
            const {_id, userId, categoryId, description, amount, date} = body;
            const id = crypto.randomUUID();

            await this.pool.query(
                `INSERT INTO charges (id, user_id, category_id, description, amount, date) VALUES ($1, $2, $3, $4, $5, $6)`,
                [id, userId, categoryId, description, amount, date]
            );
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    async deleteCharge(id: string): Promise<boolean> {
        try {
            const result = await this.pool.query(
                `DELETE FROM charges WHERE id = $1`,
                [id]
            );
            return result.rowCount === 1;
        } catch (err) {
            console.error(err);
            return false;
        }
    }
}
