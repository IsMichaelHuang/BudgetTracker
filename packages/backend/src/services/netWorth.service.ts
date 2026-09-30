import { Pool } from "pg";
import { BaseService, rowToDoc } from "./base.service";
import type { NetWorthDocument } from "types/netWorth.type";
import type { NetWorthCreate } from "../validation/netWorth.schema";

type Field = keyof Omit<NetWorthCreate, "_id" | "userId">;

/** The only fields (and columns) a net worth write may touch. */
export const NET_WORTH_COLUMNS: Record<Field, string> = {
    name: "name",
    type: "type",
    value: "value",
    description: "description",
    date: "date",
};

/** Every method is scoped to `userId`; DB errors propagate. */
export class NetWorthService extends BaseService<NetWorthDocument, Field> {
    constructor(pool: Pool) {
        super(pool, "networth", NET_WORTH_COLUMNS);
    }

    async createNetWorth(
        userId: string,
        doc: Partial<Record<Field, unknown>>
    ): Promise<boolean> {
        return this.create(userId, doc);
    }

    async updateNetWorth(
        id: string,
        userId: string,
        fields: Partial<Record<Field, unknown>>
    ): Promise<boolean> {
        return this.updateById(id, userId, fields);
    }

    async deleteNetWorth(id: string, userId: string): Promise<boolean> {
        return this.deleteById(id, userId);
    }

    async findByUserId(userId: string): Promise<NetWorthDocument[]> {
        const result = await this.pool.query(
            `SELECT * FROM networth WHERE user_id = $1`,
            [userId]
        );
        return result.rows.map((row: Record<string, unknown>) =>
            rowToDoc<NetWorthDocument>(row)
        );
    }
}
