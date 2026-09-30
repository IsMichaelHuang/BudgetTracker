import { Pool, PoolClient } from "pg";
import { rowToDoc } from "./base.service";
import type { UserDocument } from "types/user.type";
import type { CategoryDocument } from "types/category.type";
import type { ChargeDocument } from "types/charge.type";
import type { SummaryDocument } from "../types/summary.type";

/** Internal signal: user row missing; ends the transaction via ROLLBACK. */
class NotFound extends Error {}

export class SummaryService {
    constructor(private readonly pool: Pool) {}

    /**
     * Builds the summary for `id`, which the caller has already checked
     * against the token's userId. Errors propagate to the caller.
     * The write-on-read of amounts is deferred to Phase D.
     */
    async findSummaryById(id: string): Promise<SummaryDocument | null> {
        const client: PoolClient = await this.pool.connect();
        let releaseErr: Error | undefined;
        let result: SummaryDocument;
        try {
            await client.query("BEGIN");

            // Step 1: Update category amounts from charge sums
            // Categories WITH charges get their sum; categories WITHOUT charges get 0
            await client.query(
                `UPDATE categories SET amount = COALESCE(sub.total, 0)
                 FROM (
                     SELECT c.id AS cat_id,
                            COALESCE(SUM(ch.amount), 0) AS total
                     FROM categories c
                     LEFT JOIN charges ch ON ch.category_id = c.id
                     WHERE c.user_id = $1
                     GROUP BY c.id
                 ) sub
                 WHERE categories.id = sub.cat_id AND categories.user_id = $1`,
                [id]
            );

            // Step 2: Update user totalAmount from sum of category amounts
            await client.query(
                `UPDATE users SET total_amount = COALESCE(
                     (SELECT SUM(amount) FROM categories WHERE user_id = $1), 0
                 ) WHERE id = $1`,
                [id]
            );

            // Step 3: Fetch the assembled summary
            const userResult = await client.query(
                `SELECT * FROM users WHERE id = $1`,
                [id]
            );
            if (userResult.rows.length === 0) {
                throw new NotFound();
            }

            const categoriesResult = await client.query(
                `SELECT * FROM categories WHERE user_id = $1`,
                [id]
            );

            const chargesResult = await client.query(
                `SELECT * FROM charges WHERE user_id = $1`,
                [id]
            );

            await client.query("COMMIT");

            result = {
                user: rowToDoc<UserDocument>(userResult.rows[0]),
                categories: categoriesResult.rows.map(
                    (r: Record<string, unknown>) =>
                        rowToDoc<CategoryDocument>(r)
                ),
                charges: chargesResult.rows.map(
                    (r: Record<string, unknown>) => rowToDoc<ChargeDocument>(r)
                ),
            };
        } catch (err) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackErr) {
                releaseErr = rollbackErr as Error;
            }
            if (err instanceof NotFound) return null;
            throw err;
        } finally {
            if (releaseErr) client.release(releaseErr);
            else client.release();
        }

        const { user } = result;

        // Map user_credentials FK to match old MongoDB shape:
        // the FK lives on user_credentials.user_id -> users.id.
        const credResult = await this.pool.query(
            `SELECT id FROM user_credentials WHERE user_id = $1`,
            [id]
        );
        if (credResult.rows.length > 0) {
            user.userCred = credResult.rows[0].id;
        }

        return result;
    }
}
