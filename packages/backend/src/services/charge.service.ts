/**
 * @module charge.service
 * @description CRUD operations for charge (expense) documents.
 * Handles ObjectId conversion from string inputs and wraps MongoDB operations
 * with error handling that returns boolean success indicators.
 */

import { MongoClient, Collection, UpdateResult, ObjectId } from "mongodb";
import type { ChargeDocument } from "types/charge.type";


/**
 * Service for managing individual expense/charge records in the `charges` collection.
 */
export class ChargeService {
    private chargesCollection: Collection<ChargeDocument>

    /**
     * @param mongoClient - Connected MongoClient instance.
     * @throws {Error} If the CHARGES_COLLECTION_NAME environment variable is missing.
     */
    constructor(private readonly mongoClient: MongoClient) {
        const collectionChargesName = process.env.CHARGES_COLLECTION_NAME;


        if (!collectionChargesName) {
            throw new Error("Missing Charges collection name")
        }

        const db = this.mongoClient.db();
        this.chargesCollection = db.collection<ChargeDocument>(collectionChargesName);

    }

    /**
     * Updates an existing charge identified by its ID and owning user.
     * String IDs in the body are converted to ObjectIds before the update.
     *
     * @param id - String ObjectId of the charge to update.
     * @param body - Full charge document; `_id` and `userId` are used as filters, remaining fields are updated.
     * @returns `true` if the document was modified, `false` on failure or no match.
     */
    async updateChargeById(id: string, body: ChargeDocument): Promise<boolean> {
        try {
            const {_id, userId, categoryId, ...fieldsToUpdate} = body;
            const status: UpdateResult<ChargeDocument> = await this.chargesCollection.updateOne(
                // Filter by charge id and owning user id
                {_id: new ObjectId(id), userId: new ObjectId(userId)},
                {$set: {
                    categoryId: new ObjectId(categoryId),
                    ...fieldsToUpdate
                }},
            );
            return !!status.modifiedCount;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    /**
     * Creates a new charge document.
     * Converts `userId` and `categoryId` from strings to ObjectIds before insertion.
     *
     * @param body - Charge data from the request. String IDs are converted automatically.
     * @returns `true` if the insert succeeded, `false` on failure.
     */
    async createCharge(body: ChargeDocument): Promise<boolean> {
        try {
            const {userId, categoryId, ...fieldsToAdd} = body;
            const usrId = new ObjectId(userId);
            const catId = new ObjectId(categoryId);

            const result = await this.chargesCollection.insertOne({
                userId: usrId,
                categoryId: catId,
                ...fieldsToAdd
            });
            return result.insertedId ? true : false;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    /**
     * Deletes a single charge by its ID.
     *
     * @param id - String ObjectId of the charge to delete.
     * @returns `true` if exactly one document was deleted, `false` otherwise.
     */
    async deleteCharge(id: string): Promise<boolean> {
        try {
            const chargeId = new ObjectId(id);
            const result = await this.chargesCollection.deleteOne({_id: chargeId});

            return result.deletedCount === 1;
        } catch (err) {
            console.error(err);
            return false;
        }
    }
}
