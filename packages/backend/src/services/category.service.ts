/**
 * @module category.service
 * @description CRUD operations for budget category documents.
 * Extends {@link BaseService} for standard operations and adds cascade deletion
 * of associated charges when a category is removed.
 */

import { MongoClient, ObjectId } from "mongodb";
import { BaseService } from "./base.service";
import type { CategoryDocument } from "types/category.type";
import type { ChargeDocument } from "types/charge.type";

/**
 * Service for managing budget categories in the `categories` collection.
 * Inherits generic CRUD from {@link BaseService} and adds domain-specific logic.
 */
export class CategoryService extends BaseService<CategoryDocument> {
  /** Reference to the charges collection for cascade delete operations. */
  private chargesCollection;

  /**
   * @param mongoClient - Connected MongoClient instance.
   * @throws {Error} If required collection name environment variables are missing.
   */
  constructor(mongoClient: MongoClient) {
    super(mongoClient, process.env.CATEGORIES_COLLECTION_NAME!);
    const collectionChargesName = process.env.CHARGES_COLLECTION_NAME;
    if (!collectionChargesName) throw new Error("Missing Charges collection name");
    this.chargesCollection = mongoClient.db().collection<ChargeDocument>(collectionChargesName);
  }

  /**
   * Updates an existing category. Delegates to {@link BaseService.updateById}.
   *
   * @param body - Full category document; `_id` identifies the target, remaining fields are updated.
   * @returns `true` if the document was modified.
   * @throws {Error} If `_id` is not present in the body.
   */
  async updateCategory(body: CategoryDocument): Promise<boolean> {
    const { _id, userId, ...fieldsToUpdate } = body;
    if (!_id) throw new Error("No _id provided for update");
    return this.updateById(_id.toString(), fieldsToUpdate);
  }

  /**
   * Creates a new category document. Strips any client-supplied `_id` to let MongoDB generate one.
   *
   * @param body - Category data from the request.
   * @returns `true` if the insert succeeded.
   */
  async createCategory(body: CategoryDocument): Promise<boolean> {
    const { _id, ...doc } = body;
    const created = await this.create(doc);
    return !!created;
  }

  /**
   * Deletes a category and **cascade-deletes all charges** filed under it.
   * The charges are removed first, then the category document itself.
   *
   * @param id - String ObjectId of the category to delete.
   * @returns `true` if the category was successfully removed.
   */
  async deleteCategory(id: string): Promise<boolean> {
    const catId = this.toObjectId(id);
    // Cascade: remove all charges associated with this category
    await this.chargesCollection.deleteMany({ categoryId: catId });
    return this.deleteById(id);
  }
}
