import { describe, it, expect, beforeEach } from "vitest";
import { api, pool, resetTables, signUp, type TestUser } from "./db";

describe("ownership and registration (real Postgres)", () => {
    let alice: TestUser;
    let bob: TestUser;
    let catId: string;
    let chargeId: string;
    let nwId: string;

    beforeEach(async () => {
        await resetTables();
        alice = await signUp("alice");
        bob = await signUp("bob");
        await api().put("/api/category/new").set(alice.auth)
            .send({ title: "Food", allotment: 100 });
        catId = (await pool.query("SELECT id FROM categories")).rows[0].id;
        await api().put("/api/charge/new").set(alice.auth).send({
            categoryId: catId, description: "lunch", amount: 5, date: "2026-10-01",
        });
        chargeId = (await pool.query("SELECT id FROM charges")).rows[0].id;
        await api().put("/api/networth/new").set(alice.auth).send({
            name: "Savings", type: "asset", value: 50, description: "", date: "2026-10-01",
        });
        nwId = (await pool.query("SELECT id FROM networth")).rows[0].id;
    });

    async function snapshot() {
        const q = (t: string) => pool.query(`SELECT * FROM ${t} ORDER BY id`);
        return {
            categories: (await q("categories")).rows,
            charges: (await q("charges")).rows,
            networth: (await q("networth")).rows,
        };
    }

    it("charge INSERT ... SELECT casts store the right values", async () => {
        const row = (await pool.query("SELECT * FROM charges")).rows[0];
        expect(row.user_id).toBe(alice.userId);
        expect(row.category_id).toBe(catId);
        expect(row.amount).toBe(5);
        expect(row.description).toBe("lunch");
    });

    it("refuses a charge into another user's category, writing nothing", async () => {
        const res = await api().put("/api/charge/new").set(bob.auth).send({
            categoryId: catId, description: "x", amount: 1, date: "2026-10-01",
        });
        expect(res.status).toBe(404);
        const n = await pool.query("SELECT count(*)::int AS n FROM charges");
        expect(n.rows[0].n).toBe(1);
    });

    it("returns 404 and changes nothing when bob touches alice's rows", async () => {
        const before = await snapshot();
        const b = () => api();
        const results = await Promise.all([
            b().get(`/api/user/${alice.userId}`).set(bob.auth),
            b().get(`/api/networth/${alice.userId}`).set(bob.auth),
            b().patch(`/api/category/${catId}`).set(bob.auth).send({ title: "x" }),
            b().patch(`/api/charge/${chargeId}`).set(bob.auth).send({ amount: 1 }),
            b().patch(`/api/networth/${nwId}`).set(bob.auth).send({ value: 1 }),
            b().delete(`/api/charge/${chargeId}`).set(bob.auth),
            b().delete(`/api/networth/${nwId}`).set(bob.auth),
            b().delete(`/api/category/${catId}`).set(bob.auth),
        ]);
        expect(results.map((r) => r.status)).toEqual(Array(8).fill(404));
        expect(await snapshot()).toEqual(before);
    });

    it("returns 409 on a duplicate username, leaving no extra rows", async () => {
        const res = await api().post("/api/public/register").send({
            username: "alice",
            email: "again@example.com",
            plainTextPassword: "password123",
            userData: { totalAmount: 0, totalAllotment: 1 },
        });
        expect(res.status).toBe(409);
        const users = await pool.query("SELECT count(*)::int AS n FROM users");
        expect(users.rows[0].n).toBe(2); // alice + bob; rolled back
    });
});
