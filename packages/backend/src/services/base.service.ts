/**
 * @module base.service
 * @description Generic base service providing standard CRUD operations against a MongoDB collection.
 * Subclasses inherit create, find, update, and delete methods, reducing boilerplate.
 *
 * @typeParam T - The MongoDB document type managed by this service.
 */

import { MongoClient, Collection, ObjectId, Document, OptionalUnlessRequiredId, WithId } from "mongodb";

/**
 * Abstract base service that wraps a single MongoDB collection with type-safe CRUD helpers.
 * Extend this class and pass the document type as the generic parameter.
 *
 * @typeParam T - The MongoDB document shape (must extend {@link Document}).
 */
export class BaseService<T extends Document> {
  /** The underlying MongoDB collection instance. */
  protected collection: Collection<T>;

  /**
   * @param mongoClient - Connected MongoClient instance.
   * @param collectionName - Name of the MongoDB collection to operate on.
   * @throws {Error} If collectionName is falsy.
   */
  constructor( private readonly mongoClient: MongoClient, collectionName: string) {
    if (!collectionName) throw new Error("Missing collection name");
    const db = this.mongoClient.db();
    this.collection = db.collection<T>(collectionName);
  }

  /**
   * Converts a hex string to a MongoDB ObjectId.
   * @param id - 24-character hex string.
   * @returns The corresponding ObjectId.
   * @throws {Error} If the string is not a valid ObjectId.
   */
  protected toObjectId(id: string): ObjectId {
    try {
        return new ObjectId(id);
    } catch {
        throw new Error(`Invalid ObjectId: ${id}`);
    }
  }

  /**
   * Inserts a new document into the collection.
   * @param doc - Document to insert (without `_id`, which is auto-generated).
   * @returns `true` if the insert succeeded.
   */
  async create(doc: OptionalUnlessRequiredId<T>): Promise<boolean> {
    const result = await this.collection.insertOne(doc);
    return !!result.insertedId;
  }

  /**
   * Retrieves a single document by its `_id`.
   * @param id - String representation of the document's ObjectId.
   * @returns The matched document, or `null` if not found.
   */
  async findById(id: string): Promise<WithId<T> | null> {
    return await this.collection.findOne({ _id: this.toObjectId(id) } as any);
  }

  /**
   * Partially updates a document identified by `_id`.
   * @param id - String representation of the document's ObjectId.
   * @param updateFields - Fields to set via `$set`.
   * @returns `true` if at least one field was modified.
   */
  async updateById(id: string, updateFields: Partial<T>): Promise<boolean> {
    const result = await this.collection.updateOne(
        { _id: this.toObjectId(id) } as any,
        { $set: updateFields }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Deletes a single document by its `_id`.
   * @param id - String representation of the document's ObjectId.
   * @returns `true` if the document was deleted.
   */
  async deleteById(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: this.toObjectId(id) } as any);
    return result.deletedCount > 0;
  }
}
