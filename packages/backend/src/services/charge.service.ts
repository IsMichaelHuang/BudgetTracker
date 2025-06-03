import { MongoClient, Collection, UpdateResult, ObjectId } from "mongodb";
import type { ChargeDocument } from "types/charge.type";


export class ChargeService {
    private chargesCollection: Collection<ChargeDocument>

    constructor(private readonly mongoClient: MongoClient) {
        const collectionChargesName = process.env.CHARGES_COLLECTION_NAME;
        

        if (!collectionChargesName) {
            throw new Error("Missing Charges collection name")
        }

        const db = this.mongoClient.db();
        this.chargesCollection = db.collection<ChargeDocument>(collectionChargesName);

    }

    async updateChargeById(id: string, body: ChargeDocument): Promise<boolean> {
        try {
            const {_id, userId, categoryId, ...fieldsToUpdate} = body;
            const status: UpdateResult<ChargeDocument> = await this.chargesCollection.updateOne(
                // Filter by id and userId
                {_id: new ObjectId(id), userId: new ObjectId(userId)}, 
                // Spread the field
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

