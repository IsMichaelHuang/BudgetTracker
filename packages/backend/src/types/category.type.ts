/**
 * @module category.type
 * @description MongoDB document schema for budget categories.
 * Categories group related charges under a named budget line item with a spending limit.
 */

import { ObjectId } from "mongodb";

/**
 * Represents a category document in the `categories` collection.
 * Each category belongs to a user and tracks cumulative spending against a budgeted allotment.
 */
export interface CategoryDocument {
    /** MongoDB document identifier. Auto-generated on insert if omitted. */
    _id?: ObjectId;
    /** Reference to the {@link UserDocument} that owns this category. */
    userId: ObjectId;
    /** Display title of the budget category (e.g., "Food", "Rent", "Utilities"). */
    title: string;
    /** Current total amount spent in this category. Recalculated by the summary service. */
    amount: number;
    /** Maximum budgeted spend for this category. */
    allotment: number;
}
