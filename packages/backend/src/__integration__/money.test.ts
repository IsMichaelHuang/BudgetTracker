import { describe, it, expect, beforeEach } from "vitest";
import { api, resetTables, signUp, type TestUser } from "./db";

async function addCategory(u: TestUser, title: string, allotment: number) {
    const res = await api()
        .put("/api/category/new")
        .set(u.auth)
        .send({ title, allotment });
    expect(res.status).toBe(201);
}

async function addCharge(u: TestUser, categoryId: string, amount: number) {
    const res = await api().put("/api/charge/new").set(u.auth).send({
        categoryId,
        description: `charge ${amount}`,
        amount,
        date: "2026-10-01",
    });
    expect(res.status).toBe(201);
}

async function summary(u: TestUser) {
    const res = await api().get(`/api/user/${u.userId}`).set(u.auth);
    expect(res.status).toBe(200);
    return res.body;
}

describe("money fields (real Postgres)", () => {
    let alice: TestUser;

    beforeEach(async () => {
        await resetTables();
        alice = await signUp("alice");
    });

    it("returns NUMERIC columns as JSON numbers in the summary", async () => {
        await addCategory(alice, "Food", 200.5);
        const cat = (await summary(alice)).categories[0];
        await addCharge(alice, cat._id, 12.34);

        const s = await summary(alice);
        expect(s.user.totalAmount).toBe(12.34);
        expect(s.user.totalAllotment).toBe(500);
        expect(s.categories[0].amount).toBe(12.34);
        expect(s.categories[0].allotment).toBe(200.5);
        expect(s.charges[0].amount).toBe(12.34);
    });

    it("returns net worth values as JSON numbers", async () => {
        const created = await api()
            .put("/api/networth/new")
            .set(alice.auth)
            .send({
                name: "Car loan",
                type: "liability",
                value: 1000.25,
                description: "",
                date: "2026-10-01",
            });
        expect(created.status).toBe(201);

        const list = await api()
            .get(`/api/networth/${alice.userId}`)
            .set(alice.auth);
        expect(list.status).toBe(200);
        expect(list.body[0].value).toBe(1000.25);
    });

    it("sums 0.1 + 0.2 to exactly 0.3", async () => {
        await addCategory(alice, "Misc", 10);
        const cat = (await summary(alice)).categories[0];
        await addCharge(alice, cat._id, 0.1);
        await addCharge(alice, cat._id, 0.2);

        const s = await summary(alice);
        expect(s.categories[0].amount).toBe(0.3);
        expect(s.user.totalAmount).toBe(0.3);
    });

    it("accepts a category sent back exactly as the API returned it", async () => {
        await addCategory(alice, "Food", 200);
        const cat = (await summary(alice)).categories[0];

        const res = await api()
            .patch(`/api/category/${cat._id}`)
            .set(alice.auth)
            .send({ ...cat, title: "Groceries" });
        expect(res.status).toBe(201);
        expect((await summary(alice)).categories[0].title).toBe("Groceries");
    });

    it("accepts a charge sent back as the edit form sends it", async () => {
        await addCategory(alice, "Food", 200);
        const cat = (await summary(alice)).categories[0];
        await addCharge(alice, cat._id, 9.99);
        const ch = (await summary(alice)).charges[0];

        // ChargeFormPage keeps amount as-is and trims date to YYYY-MM-DD.
        const res = await api()
            .patch(`/api/charge/${ch._id}`)
            .set(alice.auth)
            .send({
                _id: ch._id,
                userId: ch.userId,
                categoryId: ch.categoryId,
                description: "edited",
                amount: ch.amount,
                date: ch.date.slice(0, 10),
            });
        expect(res.status).toBe(201);
    });
});
