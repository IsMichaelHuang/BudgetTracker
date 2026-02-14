/**
 * @module summary.service
 * @description Aggregates a user's complete financial data into a single summary document.
 * Performs a multi-step pipeline: recalculates category amounts from charges,
 * updates the user's total, then returns the full summary.
 */

import { MongoClient, Collection, ObjectId } from "mongodb";
import type { UserDocument } from "types/user.type";
import type { CategoryDocument } from "types/category.type";
import type { ChargeDocument } from "types/charge.type";
import type { SummaryDocument } from "../types/summary.type";


/**
 * Service that builds the user dashboard summary by aggregating data across
 * users, categories, and charges collections.
 */
export class SummaryService {
    private usersCollection: Collection<UserDocument>
    private categoriesCollection: Collection<CategoryDocument>
    private chargesCollection: Collection<ChargeDocument>

    /**
     * @param mongoClient - Connected MongoClient instance.
     * @throws {Error} If any required collection name environment variable is missing.
     */
    constructor(private readonly mongoClient: MongoClient) {
        const collectionUsersName = process.env.USERS_COLLECTION_NAME;
        const collectionCategoriesName = process.env.CATEGORIES_COLLECTION_NAME;
        const collectionChargesName = process.env.CHARGES_COLLECTION_NAME;

        if (!collectionUsersName || !collectionCategoriesName || !collectionChargesName) {
            throw new Error("Missing one or more collection names in environment variables");
        }

        const db = this.mongoClient.db();
        this.usersCollection = db.collection<UserDocument>(collectionUsersName);
        this.categoriesCollection = db.collection<CategoryDocument>(collectionCategoriesName);
        this.chargesCollection = db.collection<ChargeDocument>(collectionChargesName);
    }

    /**
     * Builds a complete financial summary for a user. This method:
     * 1. Aggregates charge totals grouped by category
     * 2. Updates each category's `amount` field (zero for categories with no charges)
     * 3. Recalculates the user's `totalAmount` from updated category amounts
     * 4. Returns the assembled summary document
     *
     * @param id - String ObjectId of the user.
     * @returns The complete {@link SummaryDocument}, or throws on invalid input.
     * @throws {Error} If the ID is not a valid ObjectId string.
     */
    async findSummaryById(id: string): Promise<SummaryDocument | null> {
        try {
            let _id: ObjectId;
            try {
                _id = new ObjectId(id);
            } catch {
                throw new Error(`Invalid Objectid strings: ${id}`);
            }

            // Step 1: Aggregate charge totals grouped by categoryId
            const sums = await this.chargesCollection.aggregate([
                {$match: {userId: _id}},
                {$group: {_id: "$categoryId", totalAmount: {$sum: "$amount"}}}
            ]).toArray();

            // Step 2: Identify categories with and without charges
            const allCategoryIds = (await this.categoriesCollection
                .find({userId: _id}, { projection: {_id: 1} })
                .toArray()).map(cat => cat._id);

            const chargeCategoryIds = sums.map(sum => sum._id);
            const noChargeCategoryIds = allCategoryIds.filter(
                id => !chargeCategoryIds.some(chargeId => chargeId.equals(id))
            );

            // Build bulkWrite operations: set amount from charges or zero for empty categories
            const chargeOps = sums.map(({_id: categoryIds, totalAmount}) => ({
                updateOne: {
                    filter: {_id: categoryIds, userId: _id},
                    update: {$set: {amount: totalAmount}}
                }
            }));

            const noChargeOps = noChargeCategoryIds.map(categoryId => ({
                updateOne: {
                    filter: {_id: categoryId, userId: _id},
                    update: { $set: {amount: 0}}
                }
            }));

            if (chargeOps.length > 0 || noChargeOps.length > 0) {
                await this.categoriesCollection.bulkWrite([...chargeOps, ...noChargeOps]);
            }

            // Step 3: Sum all category amounts to get the user's total spending
            const catSum = await this.categoriesCollection.aggregate([
                {$match: {userId: _id}},
                {$group: {_id: null, totalAmount: {$sum: "$amount"}}}
            ]).toArray();
            const userAmount = catSum[0]?.totalAmount || 0;

            // Step 4: Persist the recalculated total on the user document
            await this.usersCollection.updateOne(
                {_id},
                {$set: {totalAmount: userAmount}}
            );

            // Step 5: Fetch and assemble the final summary
            const user = await this.usersCollection.findOne({_id});
            if (!user) throw new Error("User not found");

            const charges = await this.chargesCollection.find({userId: _id}).toArray();
            const categories = await this.categoriesCollection.find({userId: _id}).toArray();

            const summaryDoc: SummaryDocument = { user, categories, charges };
            return summaryDoc;
        } catch (err) {
            throw new Error(`Invalid ObjectId string: ${id}`);
        }
    }
}
