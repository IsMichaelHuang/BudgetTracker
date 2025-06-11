import { MongoClient, Collection, UpdateResult, ObjectId } from "mongodb";
import type { CategoryDocument } from "types/category.type";
import type { ChargeDocument } from "types/charge.type";


export class CategoryService {
    private categoriesCollection: Collection<CategoryDocument>
    private chargesCollection: Collection<ChargeDocument>

    constructor(private readonly mongoClient: MongoClient) {
        const collectionCategoriesName = process.env.CATEGORIES_COLLECTION_NAME;
        const collectionChargesName = process.env.CHARGES_COLLECTION_NAME;

        if (!collectionCategoriesName || !collectionChargesName) {
            throw new Error("Missing Categories or/and Charges name")
        }

        const db = this.mongoClient.db();
        this.categoriesCollection = db.collection<CategoryDocument>(collectionCategoriesName);
        this.chargesCollection = db.collection<ChargeDocument>(collectionChargesName);
    }

    async updateCategory(body: CategoryDocument): Promise<boolean> {
        try {
            const {_id, userId, ...fieldsToUpdate} = body;
            console.log("HIT", userId, _id);
            console.log(JSON.stringify(body));
            const catId = new ObjectId(_id);
            const usrId = new ObjectId(userId); 
            const status: UpdateResult<CategoryDocument> = await this.categoriesCollection.updateOne(
                {_id: catId, userId: usrId},
                {$set: {
                    ...fieldsToUpdate
                }}
            );
            console.log(status.modifiedCount);
            return !!status.modifiedCount;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    async createCategory(body: CategoryDocument): Promise<boolean> {
        try {
            const {userId, ...fieldsToAdd} = body;
            const usrId = new ObjectId(userId);

            const result = await this.categoriesCollection.insertOne({
                userId: usrId,
                ...fieldsToAdd
            });
            return result.insertedId ? true : false;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    async deleteCategory(id: string): Promise<boolean> {
        try {
            const catId = new ObjectId(id);
            await this.chargesCollection.deleteMany({categoryId: catId});
            const result = await this.categoriesCollection.deleteOne({_id: catId});

            return result.deletedCount === 1;
        } catch (err) {
            console.error(err);
            return false;
        }
    }
}

