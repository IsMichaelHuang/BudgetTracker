/**
 * @module chargeType
 * @description Client-side type definition for a charge (individual expense).
 * Mirrors the backend {@link ChargeDocument} but uses string IDs.
 */

/** Represents a single expense/charge as received from the API. */
export interface ChargeType {
    /** MongoDB ObjectId string, or `undefined` for new (unsaved) charges. */
    _id: string | undefined;
    /** ObjectId string of the owning user. */
    userId: string;
    /** ObjectId string of the category this charge belongs to. */
    categoryId: string;
    /** Human-readable description of the expense. */
    description: string;
    /** Monetary amount of the charge. */
    amount: number;
    /** Date of the charge as an ISO string (e.g., "2024-03-15"). */
    date: string;
}
