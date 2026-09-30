/**
 * @module validation/auth.schema
 * @description Request body schemas for registration and login.
 */

import { z } from "zod";
import { money } from "./common";

export const registerSchema = z
    .object({
        username: z.string().min(1).max(255),
        email: z.email().max(255),
        plainTextPassword: z.string().min(8).max(72),
        userData: z
            .object({ totalAmount: money, totalAllotment: money })
            .strict()
            // totalAmount is derived from charges; new users start at 0.
            .transform((d) => ({ ...d, totalAmount: 0 })),
    })
    .strict();

export const loginSchema = z
    .object({
        username: z.string().min(1),
        password: z.string().min(1),
    })
    .strict();

export type RegisterInput = z.output<typeof registerSchema>;
export type LoginInput = z.output<typeof loginSchema>;
