import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

const mocks = vi.hoisted(() => ({ query: vi.fn(), connect: vi.fn() }));

vi.mock("../postgres.database", () => ({
    pool: { query: mocks.query, connect: mocks.connect },
    connectPostgres: vi.fn(),
    closePostgres: vi.fn(),
}));

import request from "supertest";
import app from "../app";
import { testToken } from "./helpers";

const id = crypto.randomUUID();

interface Route {
    name: string;
    method: "put" | "patch" | "post";
    url: string;
    valid: Record<string, unknown>;
    auth: boolean;
}

const routes: Route[] = [
    {
        name: "category create",
        method: "put",
        url: "/api/category/new",
        valid: { title: "Food", allotment: 100 },
        auth: true,
    },
    {
        name: "category update",
        method: "patch",
        url: `/api/category/${id}`,
        valid: { title: "Food" },
        auth: true,
    },
    {
        name: "charge create",
        method: "put",
        url: "/api/charge/new",
        valid: {
            categoryId: id,
            description: "lunch",
            amount: 5,
            date: "2026-01-02",
        },
        auth: true,
    },
    {
        name: "charge update",
        method: "patch",
        url: `/api/charge/${id}`,
        valid: { amount: 5 },
        auth: true,
    },
    {
        name: "net worth create",
        method: "put",
        url: "/api/networth/new",
        valid: {
            name: "Savings",
            type: "asset",
            value: 10,
            description: "",
            date: "2026-01-02",
        },
        auth: true,
    },
    {
        name: "net worth update",
        method: "patch",
        url: `/api/networth/${id}`,
        valid: { value: 10 },
        auth: true,
    },
    {
        name: "register",
        method: "post",
        url: "/api/public/register",
        valid: {
            username: "newuser",
            email: "new@test.com",
            plainTextPassword: "password123",
            userData: { totalAmount: 0, totalAllotment: 10 },
        },
        auth: false,
    },
];

const badKeys = [
    "x = 1; --",
    "title) VALUES (1); DROP TABLE users; --",
    "constructor",
    "prototype",
    "toString",
    "user_id",
];

/** Sends a raw JSON body so `__proto__` is an own key after parsing. */
function send(r: Route, json: string, token: string) {
    const req = request(app)[r.method](r.url)
        .set("Content-Type", "application/json");
    if (r.auth) req.set("Authorization", `Bearer ${token}`);
    return req.send(json);
}

function expectNothingRan() {
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.connect).not.toHaveBeenCalled();
}

beforeEach(() => {
    mocks.query.mockReset();
    mocks.connect.mockReset();
});

describe.each(routes)("injection sweep: $name", (route) => {
    const { token } = testToken();

    it("control: the valid body passes validation", async () => {
        mocks.query.mockResolvedValue({ rows: [], rowCount: 0 });
        mocks.connect.mockResolvedValue({
            query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
            release: vi.fn(),
        });
        const res = await send(route, JSON.stringify(route.valid), token);
        expect(res.status).not.toBe(400);
    });

    it.each(badKeys)("rejects key %j", async (key) => {
        const body = JSON.stringify({ ...route.valid, [key]: 1 });
        const res = await send(route, body, token);
        expect(res.status).toBe(400);
        expectNothingRan();
    });

    it("rejects an own __proto__ key", async () => {
        const raw = JSON.stringify(route.valid).replace(
            /^\{/,
            '{"__proto__":{"admin":true},'
        );
        expect(Object.keys(JSON.parse(raw))).toContain("__proto__");
        const res = await send(route, raw, token);
        expect(res.status).toBe(400);
        expectNothingRan();
    });

    it("rejects a nested object as an unknown key's value", async () => {
        const extra = { a: { b: 1 } };
        const body = JSON.stringify({ ...route.valid, extra });
        const res = await send(route, body, token);
        expect(res.status).toBe(400);
        expectNothingRan();
    });

    it("rejects a nested object as a known field's value", async () => {
        const field = Object.keys(route.valid)[0];
        const body = JSON.stringify({
            ...route.valid,
            [field]: { $ne: "x", "1=1; --": [1] },
        });
        const res = await send(route, body, token);
        expect(res.status).toBe(400);
        expectNothingRan();
    });
});
