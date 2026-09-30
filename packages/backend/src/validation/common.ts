/**
 * @module validation/common
 * @description Field rules shared by every request schema.
 */

import { z } from "zod";

/** NUMERIC(12,2) upper bound. */
export const MAX_MONEY = 9999999999.99;

export const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Finite, non-negative, fits NUMERIC(12,2). */
export const money = z.number().min(0).max(MAX_MONEY);

/** Real calendar date as YYYY-MM-DD. */
export const dateString = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((s) => {
        const d = new Date(`${s}T00:00:00Z`);
        return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
    }, "Invalid calendar date");

export const uuid = z.string().regex(UUID_RE, "Invalid UUID");

/**
 * Keys the frontend sends but the server never trusts. Schemas accept
 * them; validateBody strips them after parsing.
 */
export const clientIds = {
    _id: z.unknown().optional(),
    userId: z.unknown().optional(),
};

/** True when the object has a key other than the ignored client ids. */
export function hasRealField(o: Record<string, unknown>): boolean {
    return Object.keys(o).some((k) => k !== "_id" && k !== "userId");
}

export const EMPTY_UPDATE = "At least one field is required";
