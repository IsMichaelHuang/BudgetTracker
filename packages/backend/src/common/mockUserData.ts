/**
 * @module mockUserData
 * @description Sample user data for development and testing.
 * Provides a pre-populated user profile without requiring a live database connection.
 */

/** Financial summary fields of a user (omits database-specific fields). */
export interface UserData{
    /** Total amount spent across all categories. */
    totalAmount: number;
    /** Total budget allotment across all categories. */
    totalAllotment: number;
}

/** Sample user record with representative budget totals. */
export const userData = {
    name: "Michael", totalAmount: 1000.00, totalAllotment: 1425.00
}
