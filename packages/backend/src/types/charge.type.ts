/**
 * @module charge.type
 * @description MongoDB document schema for individual expense transactions.
 * Each charge is a single spending entry linked to a user and a budget category.
 */

import { ObjectId } from "mongodb";

/**
 * Represents a charge document in the `charges` collection.
 * Charges are atomic spending records that roll up into category and user totals.
 */
export interface ChargeDocument {
    /** MongoDB document identifier. Auto-generated on insert if omitted. */
    _id?: ObjectId;
    /** Reference to the {@link UserDocument} that owns this charge. */
    userId: ObjectId;
    /** Reference to the {@link CategoryDocument} this charge is filed under. */
    categoryId: ObjectId;
    /** Human-readable description of the expense (e.g., "Grocery shopping"). */
    description: string;
    /** Monetary amount of the charge. */
    amount: number;
    /** Date on which the charge was incurred. */
    date: Date;
}
