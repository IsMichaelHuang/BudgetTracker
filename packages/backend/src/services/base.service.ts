import { MongoClient, Collection, ObjectId, Document, OptionalUnlessRequiredId, WithId } from "mongodb";

export class BaseService<T extends Document> {
  protected collection: Collection<T>;

  constructor( private readonly mongoClient: MongoClient, collectionName: string) {
    if (!collectionName) throw new Error("Missing collection name");
    const db = this.mongoClient.db();
    this.collection = db.collection<T>(collectionName);
  }

  protected toObjectId(id: string): ObjectId {
    try {
        return new ObjectId(id);
    } catch {
        throw new Error(`Invalid ObjectId: ${id}`);
    }
  }

  async create(doc: OptionalUnlessRequiredId<T>): Promise<boolean> {
    const result = await this.collection.insertOne(doc);
    return !!result.insertedId;
  }

  async findById(id: string): Promise<WithId<T> | null> {
    return await this.collection.findOne({ _id: this.toObjectId(id) } as any);
  }

  async updateById(id: string, updateFields: Partial<T>): Promise<boolean> {
    const result = await this.collection.updateOne(
        { _id: this.toObjectId(id) } as any,
        { $set: updateFields }
    );
    return result.modifiedCount > 0;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: this.toObjectId(id) } as any);
    return result.deletedCount > 0;
  }
}

