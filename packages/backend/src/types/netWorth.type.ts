/**
 * @module netWorth.type
 * @description MongoDB document schema for net worth entries.
 * Each entry represents an asset or liability linked to a user.
 */

import { ObjectId } from "mongodb";

/**
 * Represents a net worth document in the `networth` collection.
 * Net worth entries are either assets (positive value) or liabilities (negative value).
 */
export interface NetWorthDocument {
    /** MongoDB document identifier. Auto-generated on insert if omitted. */
    _id?: ObjectId;
    /** Reference to the {@link UserDocument} that owns this entry. */
    userId: ObjectId;
    /** Human-readable name of the asset or liability (e.g., "Savings Account"). */
    name: string;
    /** Whether this entry is an "asset" or "liability". */
    type: string;
    /** Monetary value of the asset or liability. */
    value: number;
    /** Description of the entry. */
    description: string;
    /** Date the entry was recorded. */
    date: Date;
}
