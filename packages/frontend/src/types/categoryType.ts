/**
 * @module categoryType
 * @description Client-side type definition for a budget category.
 * Mirrors the backend {@link CategoryDocument} but uses string IDs
 * (since JSON serialization converts ObjectIds to strings).
 */

/** Represents a budget category as received from the API. */
export interface CategoryType {
    /** MongoDB ObjectId string, or `undefined` for new (unsaved) categories. */
    _id: string | undefined;
    /** ObjectId string of the owning user. */
    userId: string;
    /** Display name of the category (e.g., "Groceries", "Rent"). */
    title: string;
    /** Current total amount spent in this category (computed from charges). */
    amount: number;
    /** Budgeted allotment for this category. */
    allotment: number;
}
