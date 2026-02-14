/**
 * @module userType
 * @description Client-side type definition for a user profile.
 * Mirrors the backend {@link UserDocument} but uses string IDs.
 */

/** Represents a user profile as received from the API. */
export interface UserType {
    /** MongoDB ObjectId string of the user document. */
    _id: string;
    /** ObjectId string linking to the associated credential document. */
    userCreds: string,
    /** Display name of the user. */
    name: string;
    /** Total amount spent across all categories (server-computed). */
    totalAmount: number;
    /** Total budgeted allotment across all categories. */
    totalAllotment: number;
}