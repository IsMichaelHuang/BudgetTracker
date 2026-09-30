/**
 * @module validation/charge.schema
 * @description Request body schemas for charge create and update.
 */

import { z } from "zod";
import {
    clientIds,
    dateString,
    hasRealField,
    money,
    uuid,
    EMPTY_UPDATE,
} from "./common";

const fields = {
    categoryId: uuid,
    description: z.string(),
    amount: money,
    date: dateString,
};

export const chargeCreateSchema = z
    .object({ ...clientIds, ...fields })
    .strict();

export const chargeUpdateSchema = z
    .object({ ...clientIds, ...z.object(fields).partial().shape })
    .strict()
    .refine(hasRealField, EMPTY_UPDATE);

export type ChargeCreate = z.output<typeof chargeCreateSchema>;
export type ChargeUpdate = z.output<typeof chargeUpdateSchema>;
