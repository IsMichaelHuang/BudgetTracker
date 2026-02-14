import { Pool } from "pg";
import { BaseService, rowToDoc } from "./base.service";
import type { NetWorthDocument } from "types/netWorth.type";

export class NetWorthService extends BaseService<NetWorthDocument> {
    constructor(pool: Pool) {
        super(pool, "networth");
    }

    async createNetWorth(body: NetWorthDocument): Promise<boolean> {
        try {
            const { _id, ...doc } = body;
            return await this.create(doc);
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    async updateNetWorth(id: string, body: NetWorthDocument): Promise<boolean> {
        try {
            const { _id, userId, ...fieldsToUpdate } = body;
            return await this.updateById(id, fieldsToUpdate);
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    async deleteNetWorth(id: string): Promise<boolean> {
        try {
            return await this.deleteById(id);
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    async findByUserId(userId: string): Promise<NetWorthDocument[]> {
        try {
            const result = await this.pool.query(
                `SELECT * FROM networth WHERE user_id = $1`,
                [userId]
            );
            return result.rows.map((row: Record<string, unknown>) => rowToDoc<NetWorthDocument>(row));
        } catch (err) {
            console.error(err);
            return [];
        }
    }
}
