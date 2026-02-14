/**
 * @module user.type
 * @description MongoDB document schema for user profiles.
 * Each user tracks aggregate budget figures and links to a credential record for authentication.
 */

import { ObjectId } from "mongodb";

/**
 * Represents a user document in the `users` collection.
 * Maintains running totals of spending and budget allotments across all categories.
 */
export interface UserDocument {
    /** MongoDB document identifier. Auto-generated on insert if omitted. */
    _id?: ObjectId;
    /** Reference to the associated {@link CredentialDocument} for authentication. */
    userCred: ObjectId;
    /** Display name of the user. */
    name: string;
    /** Aggregate amount spent across all budget categories. Recalculated by the summary service. */
    totalAmount: number;
    /** Aggregate budget allotment across all categories. */
    totalAllotment: number;
}
