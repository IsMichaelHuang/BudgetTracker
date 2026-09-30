/**
 * @module validation/category.schema
 * @description Request body schemas for category create and update.
 * `amount` is derived from charges; it is accepted and dropped.
 */

import { z } from "zod";
import { clientIds, hasRealField, money, EMPTY_UPDATE } from "./common";

const title = z.string().min(1).max(255);

function dropAmount<T extends { amount?: number }>(o: T) {
    const { amount: _amount, ...rest } = o;
    return rest;
}

export const categoryCreateSchema = z
    .object({
        ...clientIds,
        title,
        amount: money.optional(),
        allotment: money,
    })
    .strict()
    .transform(dropAmount);

export const categoryUpdateSchema = z
    .object({
        ...clientIds,
        title: title.optional(),
        amount: money.optional(),
        allotment: money.optional(),
    })
    .strict()
    .transform(dropAmount)
    .refine(hasRealField, EMPTY_UPDATE);

export type CategoryCreate = z.output<typeof categoryCreateSchema>;
export type CategoryUpdate = z.output<typeof categoryUpdateSchema>;
