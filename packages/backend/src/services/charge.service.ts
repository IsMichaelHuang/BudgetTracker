import { Pool } from "pg";
import crypto from "crypto";
import type {
    ChargeCreate,
    ChargeUpdate,
} from "../validation/charge.schema";

type Field = keyof Omit<ChargeCreate, "_id" | "userId">;

/** The only fields (and columns) a charge write may touch. */
export const CHARGE_COLUMNS: Record<Field, string> = {
    categoryId: "category_id",
    description: "description",
    amount: "amount",
    date: "date",
};

type ChargeFields = Partial<Record<Field, unknown>>;

/**
 * Charge writes and deletes, always scoped to the caller's `userId`.
 * A category is only usable if the caller owns it; that check is part
 * of the same statement as the write, so there is no check-then-write
 * race. Database errors propagate to the caller.
 */
export class ChargeService {
    constructor(private readonly pool: Pool) {}

    async updateChargeById(
        id: string,
        userId: string,
        fields: ChargeUpdate | ChargeFields
    ): Promise<boolean> {
        const entries = (Object.keys(CHARGE_COLUMNS) as Field[])
            .filter((f) => Object.hasOwn(fields, f))
            .map((f): [Field, unknown] => [
                f,
                (fields as ChargeFields)[f],
            ]);
        if (entries.length === 0) return false;

        const set = entries
            .map(([f], i) => `${CHARGE_COLUMNS[f]} = $${i + 3}`)
            .join(", ");
        const values: unknown[] = [id, userId, ...entries.map(([, v]) => v)];

        let sql =
            `UPDATE charges SET ${set} WHERE id = $1 AND user_id = $2`;
        const catIdx = entries.findIndex(([f]) => f === "categoryId");
        if (catIdx >= 0) {
            sql +=
                " AND EXISTS (SELECT 1 FROM categories " +
                `WHERE id = $${catIdx + 3} AND user_id = $2)`;
        }

        const result = await this.pool.query(sql, values);
        return (result.rowCount ?? 0) > 0;
    }

    async createCharge(
        userId: string,
        doc: ChargeCreate | ChargeFields
    ): Promise<boolean> {
        const { categoryId, description, amount, date } = doc as ChargeFields;
        const result = await this.pool.query(
            "INSERT INTO charges " +
            "(id, user_id, category_id, description, amount, date) " +
            "SELECT $1::uuid, $2::uuid, $3::uuid, $4::text, " +
            "$5::numeric, $6::timestamptz " +
            "WHERE EXISTS (SELECT 1 FROM categories " +
            "WHERE id = $3::uuid AND user_id = $2::uuid)",
            [
                crypto.randomUUID(),
                userId,
                categoryId,
                description,
                amount,
                date,
            ]
        );
        return (result.rowCount ?? 0) > 0;
    }

    async deleteCharge(id: string, userId: string): Promise<boolean> {
        const result = await this.pool.query(
            "DELETE FROM charges WHERE id = $1 AND user_id = $2",
            [id, userId]
        );
        return (result.rowCount ?? 0) > 0;
    }
}
