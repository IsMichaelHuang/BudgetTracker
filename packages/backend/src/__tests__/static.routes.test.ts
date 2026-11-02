import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";

vi.mock("../postgres.database", () => ({
    pool: { query: vi.fn(), connect: vi.fn() },
    connectPostgres: vi.fn(),
    closePostgres: vi.fn(),
}));

import request from "supertest";
import { readStaticDir } from "../config";

const ID = "123e4567-e89b-42d3-a456-426614174000";
const dirs: string[] = [];

function makeDir(withIndex: boolean): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bt-static-"));
    dirs.push(dir);
    if (withIndex) {
        fs.writeFileSync(path.join(dir, "index.html"), "<html>SPA</html>");
        fs.mkdirSync(path.join(dir, "assets"));
        fs.writeFileSync(path.join(dir, "assets/app.js"), "console.log(1)");
    }
    return dir;
}

async function loadApp(dir: string) {
    process.env.STATIC_DIR = dir;
    vi.resetModules();
    return (await import("../app")).default;
}

afterAll(() => dirs.forEach((d) => fs.rmSync(d, { recursive: true })));

describe("serving the frontend build", () => {
    let app: Awaited<ReturnType<typeof loadApp>>;
    beforeAll(async () => {
        app = await loadApp(makeDir(true));
    });

    it("serves index.html at /", async () => {
        const res = await request(app).get("/");
        expect(res.status).toBe(200);
        expect(res.type).toBe("text/html");
    });

    it("serves built assets", async () => {
        const res = await request(app).get("/assets/app.js");
        expect(res.status).toBe(200);
        expect(res.type).toMatch(/javascript/);
    });

    it.each([
        `/alice/${ID}`,
        `/alice/${ID}/`,
        "/net-worth",
        `/alice/${ID}/food/${ID}`,
    ])("serves index.html for deep link %s", async (url) => {
        const res = await request(app).get(url);
        expect(res.status).toBe(200);
        expect(res.text).toContain("SPA");
    });

    it("404s a missing asset instead of serving html", async () => {
        const res = await request(app).get("/assets/missing.js");
        expect(res.status).toBe(404);
    });

    it.each(["/api", "/api/nope", "/API/nope"])(
        "keeps %s behind auth",
        async (url) => {
            expect((await request(app).get(url)).status).toBe(401);
        }
    );

    it.each(["/.env", "/..%2f..%2fpackage.json"])(
        "does not leak files via %s",
        async (url) => {
            const res = await request(app).get(url);
            expect(res.text).not.toContain("JWT_SECRET");
            expect(res.text).not.toContain('"name"');
        }
    );
});

describe("missing index.html", () => {
    it("answers 500 JSON without the directory path", async () => {
        const dir = makeDir(false);
        const app = await loadApp(dir);
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        const res = await request(app).get("/x");
        spy.mockRestore();
        expect(res.status).toBe(500);
        expect(res.type).toBe("application/json");
        expect(res.text).not.toContain(dir);
    });
});

describe("readStaticDir", () => {
    it("defaults to an absolute frontend/dist", () => {
        const dir = readStaticDir({});
        expect(path.isAbsolute(dir)).toBe(true);
        expect(dir.endsWith(path.join("frontend", "dist"))).toBe(true);
    });

    it("treats an empty value as unset", () => {
        expect(readStaticDir({ STATIC_DIR: "" })).toBe(readStaticDir({}));
    });

    it("resolves a relative value", () => {
        expect(readStaticDir({ STATIC_DIR: "../x" })).toBe(
            path.resolve("../x")
        );
    });
});
