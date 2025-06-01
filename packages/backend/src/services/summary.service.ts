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
            const _id = new ObjectId(id);
            const user = await this.usersCollection.findOne({_id});
            if (!user) throw new Error("User not found");

            const categories = await this.categoriesCollection.find({userId: _id}).toArray();
            const charges = await this.chargesCollection.find({userId: _id}).toArray(); 

            const summaryDoc: SummaryDocument = { user, categories, charges };
            return summaryDoc;
        } catch (err) {
            throw new Error(`Invalid ObjectId string: ${id}`);
        } 
    }

    /*
    async getAllSummary(){
        const users = <SummaryDocument[]>[];
        return users;
    };
    */
}

