import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({ query: vi.fn(), connect: vi.fn() }));

vi.mock("../postgres.database", () => ({
    pool: { query: mocks.query, connect: mocks.connect },
    connectPostgres: vi.fn(),
    closePostgres: vi.fn(),
}));

import request from "supertest";
import app from "../app";
import { testToken } from "./helpers";

describe("error handling", () => {
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        mocks.query.mockReset();
        errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });
    afterEach(() => errorSpy.mockRestore());

    it("answers malformed JSON with 400 JSON", async () => {
        const res = await request(app)
            .post("/api/public/login")
            .set("Content-Type", "application/json")
            .send('{"username": "alice",');
        expect(res.status).toBe(400);
        expect(res.type).toBe("application/json");
        expect(res.body).toEqual({ error: "Malformed JSON body" });
    });

    it("answers an oversized body with 413 JSON", async () => {
        const res = await request(app)
            .post("/api/public/login")
            .send({ username: "a", password: "x".repeat(200_000) });
        expect(res.status).toBe(413);
        expect(res.body).toEqual({ error: "Request body too large" });
    });

    it("answers an unexpected error with 500 JSON and no stack", async () => {
        mocks.query.mockRejectedValue(new Error("boom: secret detail"));
        const { token, userId } = testToken();
        const res = await request(app)
            .get(`/api/networth/${userId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(500);
        expect(res.type).toBe("application/json");
        expect(res.body).toEqual({ error: "Internal server error" });
        expect(res.text).not.toContain("boom");
        expect(errorSpy).toHaveBeenCalled();
    });
});
