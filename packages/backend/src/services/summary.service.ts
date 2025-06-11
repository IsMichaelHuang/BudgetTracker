import { MongoClient, Collection, ObjectId } from "mongodb";
import type { UserDocument } from "types/user.type";
import type { CategoryDocument } from "types/category.type";
import type { ChargeDocument } from "types/charge.type";
import type { SummaryDocument } from "../types/summary.type";


export class SummaryService {
    private usersCollection: Collection<UserDocument>
    private categoriesCollection: Collection<CategoryDocument>
    private chargesCollection: Collection<ChargeDocument>

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
    
    async findSummaryById(id: string): Promise<SummaryDocument | null> {
        try {
            let _id: ObjectId;
            try {
                _id = new ObjectId(id);
            } catch {
                throw new Error(`Invalid Objectid strings: ${id}`);
            }   

            // Get sum total from charges and their respected categories
            const sums = await this.chargesCollection.aggregate([
                {$match: {userId: _id}},
                {$group: {_id: "$categoryId", totalAmount: {$sum: "$amount"}}}
            ]).toArray();

            // Get all the categoryIds with this userId
            const allCategoryIds = (await this.categoriesCollection
                .find({userId: _id}, { projection: {_id: 1} })
                .toArray()).map(cat => cat._id);
            
            const chargeCategoryIds = sums.map(sum => sum._id);
            const noChargeCategoryIds = allCategoryIds.filter(
                id => !chargeCategoryIds.some(chargeId => chargeId.equals(id))
            );
            

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

            // Get sum of all categories for userId
            const catSum = await this.categoriesCollection.aggregate([
                {$match: {userId: _id}},
                {$group: {_id: null, totalAmount: {$sum: "$amount"}}}
            ]).toArray();
            const userAmount = catSum[0]?.totalAmount || 0;

            // Update user totalAmount
            await this.usersCollection.updateOne(
                {_id},
                {$set: {totalAmount: userAmount}}
            );

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

