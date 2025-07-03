import { MongoClient, ObjectId } from "mongodb";
import { BaseService } from "./base.service";
import type { CategoryDocument } from "types/category.type";
import type { ChargeDocument } from "types/charge.type";

export class CategoryService extends BaseService<CategoryDocument> {
  private chargesCollection;

  constructor(mongoClient: MongoClient) {
    super(mongoClient, process.env.CATEGORIES_COLLECTION_NAME!);
    const collectionChargesName = process.env.CHARGES_COLLECTION_NAME;
    if (!collectionChargesName) throw new Error("Missing Charges collection name");
    this.chargesCollection = mongoClient.db().collection<ChargeDocument>(collectionChargesName);
  }

  // For updateCategory, just call base updateById
  async updateCategory(body: CategoryDocument): Promise<boolean> {
    const { _id, userId, ...fieldsToUpdate } = body;
    if (!_id) throw new Error("No _id provided for update");
    return this.updateById(_id.toString(), fieldsToUpdate);
  }

  // For createCategory, just call base create
  async createCategory(body: CategoryDocument): Promise<boolean> {
    const { _id, ...doc } = body; // drop _id if present, let Mongo create it
    const created = await this.create(doc);
    return !!created;
  }

  // For deleteCategory, handle cascade delete, then call base deleteById
  async deleteCategory(id: string): Promise<boolean> {
    const catId = this.toObjectId(id);
    await this.chargesCollection.deleteMany({ categoryId: catId });
    return this.deleteById(id);
  }
}
