/**
 * @module netWorthType
 * @description Client-side type definition for a net worth entry (asset or liability).
 * Mirrors the backend {@link NetWorthDocument} but uses string IDs.
 */

/** Represents a single net worth entry as received from the API. */
export interface NetWorthType {
    /** MongoDB ObjectId string, or `undefined` for new (unsaved) entries. */
    _id: string | undefined;
    /** ObjectId string of the owning user. */
    userId: string;
    /** Human-readable name of the asset or liability. */
    name: string;
    /** Whether this entry is an "asset" or "liability". */
    type: string;
    /** Monetary value of the asset or liability. */
    value: number;
    /** Description of the entry. */
    description: string;
    /** Date of the entry as an ISO string (e.g., "2024-03-15"). */
    date: string;
}
