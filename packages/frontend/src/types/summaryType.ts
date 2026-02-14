/**
 * @module summaryType
 * @description Client-side type definition for the user dashboard summary.
 * Combines user profile data with all their categories and charges
 * into a single payload returned by the `/api/user/:id` endpoint.
 */

import type { UserType } from "./userType";
import type { CategoryType } from "./categoryType";
import type { ChargeType } from "./chargeType";

/** Aggregated financial summary for a single user's dashboard view. */
export interface SummaryType {
    /** The user's profile data (name, totals). */
    user: UserType;
    /** All budget categories belonging to the user. */
    categories: CategoryType[];
    /** All individual charges/expenses belonging to the user. */
    charges: ChargeType[];
}
