/**
 * @module summary.type
 * @description Composite summary document aggregating a user's complete financial data
 * into a single response payload for the dashboard endpoint.
 */

import type { UserDocument } from "./user.type";
import type { CategoryDocument } from "./category.type";
import type { ChargeDocument } from "./charge.type";

/**
 * Aggregated user dashboard data returned by `GET /api/user/:id`.
 * Combines the user profile, all budget categories, and all charges in one request.
 */
export interface SummaryDocument {
    /** The user's profile and aggregate financial figures. */
    user: UserDocument;
    /** All budget categories belonging to the user. */
    categories: CategoryDocument[];
    /** All individual charges recorded by the user. */
    charges: ChargeDocument[];
}
