import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
    categoryCreateSchema,
    categoryUpdateSchema,
} from "../validation/category.schema";
import {
    chargeCreateSchema,
    chargeUpdateSchema,
} from "../validation/charge.schema";
import {
    netWorthCreateSchema,
    netWorthUpdateSchema,
} from "../validation/netWorth.schema";
import {
    registerSchema,
    loginSchema,
} from "../validation/auth.schema";

const uuid = () => crypto.randomUUID();
const ok = (s: any, v: unknown) => s.safeParse(v).success;

describe("category schemas", () => {
    const create = { userId: uuid(), title: "Food", amount: 0, allotment: 400 };

    it("accepts the frontend create shape and drops amount", () => {
        const r = categoryCreateSchema.parse(create);
        expect(r.title).toBe("Food");
        expect(r.allotment).toBe(400);
        expect("amount" in r).toBe(false);
    });

    it("accepts the frontend PATCH shape (_id, userId, amount)", () => {
        const r = categoryUpdateSchema.parse({
            _id: uuid(), userId: uuid(), title: "F", amount: 5, allotment: 9,
        });
        expect(r.title).toBe("F");
        expect("amount" in r).toBe(false);
    });

    it("rejects unknown keys, including SQL-looking ones", () => {
        expect(ok(categoryCreateSchema, { ...create, "x = 1; --": 1 })).toBe(
            false
        );
        expect(ok(categoryUpdateSchema, { title: "a", extra: 1 })).toBe(false);
    });

    it("rejects an own __proto__ key", () => {
        const body = JSON.parse('{"title":"a","allotment":1,"__proto__":{}}');
        expect(ok(categoryCreateSchema, body)).toBe(false);
    });

    it("rejects missing title, empty title, negative/huge/NaN numbers", () => {
        expect(ok(categoryCreateSchema, { allotment: 1 })).toBe(false);
        expect(ok(categoryCreateSchema, { title: "", allotment: 1 })).toBe(
            false
        );
        for (const allotment of [-1, 1e10, NaN, Infinity, "5"]) {
            expect(ok(categoryCreateSchema, { title: "a", allotment })).toBe(
                false
            );
        }
        const max = { title: "a", allotment: 9999999999.99 };
        expect(ok(categoryCreateSchema, max)).toBe(true);
    });

    it("rejects an update with no real fields", () => {
        expect(ok(categoryUpdateSchema, {})).toBe(false);
        expect(ok(categoryUpdateSchema, { _id: uuid(), userId: uuid() })).toBe(
            false
        );
        expect(ok(categoryUpdateSchema, { amount: 3 })).toBe(false);
        expect(ok(categoryUpdateSchema, { allotment: 3 })).toBe(true);
    });
});

describe("charge schemas", () => {
    const create = {
        userId: uuid(),
        categoryId: uuid(),
        description: "Grocery",
        amount: 50.25,
        date: "2024-01-15",
    };

    it("accepts the frontend create shape", () => {
        expect(ok(chargeCreateSchema, create)).toBe(true);
    });

    it("accepts an empty description", () => {
        expect(ok(chargeCreateSchema, { ...create, description: "" })).toBe(
            true
        );
    });

    it("accepts the frontend PATCH shape with _id and userId", () => {
        expect(ok(chargeUpdateSchema, { ...create, _id: uuid() })).toBe(true);
    });

    it("rejects bad categoryId, dates, and empty date", () => {
        expect(ok(chargeCreateSchema, { ...create, categoryId: "1" })).toBe(
            false
        );
        for (const date of ["", "2024-13-01", "2024-02-30", "01/15/2024", 5]) {
            expect(ok(chargeCreateSchema, { ...create, date })).toBe(false);
        }
    });

    it("rejects negative amount and unknown keys", () => {
        expect(ok(chargeCreateSchema, { ...create, amount: -0.01 })).toBe(
            false
        );
        expect(ok(chargeCreateSchema, { ...create, id: uuid() })).toBe(false);
    });

    it("requires all fields on create", () => {
        const { date, ...rest } = create;
        expect(ok(chargeCreateSchema, rest)).toBe(false);
    });

    it("allows partial update but not an empty one", () => {
        expect(ok(chargeUpdateSchema, { amount: 1 })).toBe(true);
        expect(ok(chargeUpdateSchema, {})).toBe(false);
        expect(ok(chargeUpdateSchema, { userId: uuid() })).toBe(false);
    });
});

describe("net worth schemas", () => {
    const create = {
        userId: uuid(),
        name: "Savings",
        type: "asset",
        value: 10000,
        description: "Bank",
        date: "2024-01-15",
    };

    it("accepts the frontend create and PATCH shapes", () => {
        expect(ok(netWorthCreateSchema, create)).toBe(true);
        expect(ok(netWorthUpdateSchema, { ...create, _id: uuid() })).toBe(true);
    });

    it("accepts empty description and empty type", () => {
        expect(
            ok(netWorthCreateSchema, { ...create, description: "", type: "" })
        ).toBe(true);
    });

    it("rejects empty name, negative value, bad date, unknown key", () => {
        expect(ok(netWorthCreateSchema, { ...create, name: "" })).toBe(false);
        expect(ok(netWorthCreateSchema, { ...create, value: -1 })).toBe(false);
        expect(ok(netWorthCreateSchema, { ...create, date: "" })).toBe(false);
        expect(ok(netWorthCreateSchema, { ...create, foo: 1 })).toBe(false);
    });

    it("rejects an empty update", () => {
        expect(ok(netWorthUpdateSchema, {})).toBe(false);
        expect(ok(netWorthUpdateSchema, { value: 2 })).toBe(true);
    });
});

describe("register and login schemas", () => {
    const reg = {
        username: "newuser",
        email: "new@test.com",
        plainTextPassword: "password",
        userData: { totalAmount: 0, totalAllotment: 1000 },
    };

    it("accepts a valid registration; password 8 ok, 7 rejected", () => {
        expect(ok(registerSchema, reg)).toBe(true);
        expect(
            ok(registerSchema, { ...reg, plainTextPassword: "1234567" })
        ).toBe(false);
        expect(
            ok(registerSchema, { ...reg, plainTextPassword: "12345678" })
        ).toBe(true);
    });

    it("caps the password at 72 chars", () => {
        const p = (n: number) => ({ ...reg, plainTextPassword: "a".repeat(n) });
        expect(ok(registerSchema, p(72))).toBe(true);
        expect(ok(registerSchema, p(73))).toBe(false);
    });

    it("rejects bad email, missing fields, negative totals", () => {
        expect(ok(registerSchema, { ...reg, email: "nope" })).toBe(false);
        expect(ok(registerSchema, { ...reg, username: "" })).toBe(false);
        const { userData, ...rest } = reg;
        expect(ok(registerSchema, rest)).toBe(false);
        expect(
            ok(registerSchema, {
                ...reg,
                userData: { totalAmount: 0, totalAllotment: -1 },
            })
        ).toBe(false);
        expect(ok(registerSchema, { ...reg, role: "admin" })).toBe(false);
    });

    it("forces totalAmount to 0", () => {
        const r = registerSchema.parse({
            ...reg,
            userData: { totalAmount: 500, totalAllotment: 10 },
        });
        expect(r.userData.totalAmount).toBe(0);
        expect(r.userData.totalAllotment).toBe(10);
    });

    it("login needs non-empty strings only", () => {
        expect(ok(loginSchema, { username: "a", password: "x" })).toBe(true);
        expect(ok(loginSchema, { username: "", password: "x" })).toBe(false);
        expect(ok(loginSchema, { username: "a" })).toBe(false);
        expect(ok(loginSchema, { username: "a", password: {} })).toBe(false);
    });
});
