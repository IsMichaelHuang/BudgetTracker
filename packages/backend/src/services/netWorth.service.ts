/**
 * @module netWorth.service
 * @description CRUD operations for net worth documents.
 * Extends {@link BaseService} for standard operations and adds
 * convenience methods for net worth-specific queries.
 */

import { MongoClient, ObjectId } from "mongodb";
import { BaseService } from "./base.service";
import type { NetWorthDocument } from "types/netWorth.type";

/**
 * Service for managing net worth entries in the `networth` collection.
 * Inherits generic CRUD from {@link BaseService} and adds domain-specific logic.
 */
export class NetWorthService extends BaseService<NetWorthDocument> {
  /**
   * @param mongoClient - Connected MongoClient instance.
   * @throws {Error} If required collection name environment variables are missing.
   */
  constructor(mongoClient: MongoClient) {
    super(mongoClient, process.env.NETWORTH_COLLECTION_NAME!);
  }

  /**
   * Creates a new net worth entry. Strips any client-supplied `_id` to let MongoDB generate one.
   * Converts string userId to ObjectId before insertion.
   *
   * @param body - Net worth data from the request.
   * @returns `true` if the insert succeeded.
   */
  async createNetWorth(body: NetWorthDocument): Promise<boolean> {
    try {
      const { _id, userId, ...fieldsToAdd } = body;
      const result = await this.collection.insertOne({
        userId: new ObjectId(userId),
        ...fieldsToAdd,
      });
      return !!result.insertedId;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  /**
   * Updates an existing net worth entry.
   *
   * @param id - String ObjectId of the entry to update.
   * @param body - Full net worth document; `_id` and `userId` are stripped, remaining fields are updated.
   * @returns `true` if the document was modified.
   */
  async updateNetWorth(id: string, body: NetWorthDocument): Promise<boolean> {
    try {
      const { _id, userId, ...fieldsToUpdate } = body;
      return this.updateById(id, fieldsToUpdate);
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  /**
   * Deletes a net worth entry by its ID.
   *
   * @param id - String ObjectId of the entry to delete.
   * @returns `true` if the document was deleted.
   */
  async deleteNetWorth(id: string): Promise<boolean> {
    try {
      return this.deleteById(id);
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  /**
   * Retrieves all net worth entries for a given user.
   *
   * @param userId - String ObjectId of the user.
   * @returns Array of net worth documents belonging to the user.
   */
  async findByUserId(userId: string): Promise<NetWorthDocument[]> {
    try {
      return this.collection
        .find({ userId: new ObjectId(userId) } as any)
        .toArray() as unknown as NetWorthDocument[];
    } catch (err) {
      console.error(err);
      return [];
    }
  }
}
