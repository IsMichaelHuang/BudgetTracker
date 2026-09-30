/**
 * @module validation/netWorth.schema
 * @description Request body schemas for net worth create and update.
 */

import { z } from "zod";
import {
    clientIds,
    dateString,
    hasRealField,
    money,
    EMPTY_UPDATE,
} from "./common";

const fields = {
    name: z.string().min(1).max(255),
    type: z.string().max(100),
    value: money,
    description: z.string(),
    date: dateString,
};

export const netWorthCreateSchema = z
    .object({ ...clientIds, ...fields })
    .strict();

export const netWorthUpdateSchema = z
    .object({ ...clientIds, ...z.object(fields).partial().shape })
    .strict()
    .refine(hasRealField, EMPTY_UPDATE);

export type NetWorthCreate = z.output<typeof netWorthCreateSchema>;
export type NetWorthUpdate = z.output<typeof netWorthUpdateSchema>;
