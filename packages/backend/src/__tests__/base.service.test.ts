import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";
import { BaseService } from "../services/base.service";

const COLUMNS = { title: "title", allotment: "allotment" };

function make() {
    const query = vi.fn().mockResolvedValue({ rows: [], rowCount: 1 });
    const svc = new BaseService<any, "title" | "allotment">(
        { query } as any,
        "categories",
        COLUMNS
    );
    return { svc, query };
}

describe("BaseService", () => {
    const uid = crypto.randomUUID();
    const id = crypto.randomUUID();

    it("create inserts user_id first and only mapped columns", async () => {
        const { svc, query } = make();
        await expect(svc.create(uid, { title: "t", allotment: 2 })).resolves
            .toBe(true);
        const [sql, params] = query.mock.calls[0];
        expect(sql).toBe(
            "INSERT INTO categories (id, user_id, title, allotment) " +
            "VALUES ($1, $2, $3, $4)"
        );
        expect(params[1]).toBe(uid);
        expect(params.slice(2)).toEqual(["t", 2]);
    });

    it("create throws for a key outside the column map", async () => {
        const { svc, query } = make();
        await expect(
            svc.create(uid, { title: "t", "x; DROP TABLE a": 1 } as any)
        ).rejects.toThrow(/column/i);
        await expect(
            svc.create(uid, { user_id: "other" } as any)
        ).rejects.toThrow(/column/i);
        expect(query).not.toHaveBeenCalled();
    });

    it("findById scopes by user_id and maps the row", async () => {
        const { svc, query } = make();
        query.mockResolvedValueOnce({
            rows: [{ id, user_id: uid, title: "t" }],
            rowCount: 1,
        });
        const doc = await svc.findById(id, uid);
        expect(query).toHaveBeenCalledWith(
            "SELECT * FROM categories WHERE id = $1 AND user_id = $2",
            [id, uid]
        );
        expect(doc).toEqual({ _id: id, userId: uid, title: "t" });
    });

    it("findById returns null when no row matches", async () => {
        const { svc, query } = make();
        query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
        await expect(svc.findById(id, uid)).resolves.toBeNull();
    });

    it("updateById scopes by user_id and returns rowCount > 0", async () => {
        const { svc, query } = make();
        await expect(svc.updateById(id, uid, { title: "n" })).resolves
            .toBe(true);
        expect(query).toHaveBeenCalledWith(
            "UPDATE categories SET title = $3 WHERE id = $1 AND user_id = $2",
            [id, uid, "n"]
        );
        query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
        await expect(svc.updateById(id, uid, { title: "n" })).resolves
            .toBe(false);
    });

    it("updateById rejects unmapped keys, skips empties", async () => {
        const { svc, query } = make();
        await expect(
            svc.updateById(id, uid, { "a=1": 1 } as any)
        ).rejects.toThrow(/column/i);
        await expect(svc.updateById(id, uid, {})).resolves.toBe(false);
        expect(query).not.toHaveBeenCalled();
    });

    it("deleteById scopes by user_id", async () => {
        const { svc, query } = make();
        await svc.deleteById(id, uid);
        expect(query).toHaveBeenCalledWith(
            "DELETE FROM categories WHERE id = $1 AND user_id = $2",
            [id, uid]
        );
    });

    it("does not swallow database errors", async () => {
        const { svc, query } = make();
        const err = new Error("db down");
        query.mockRejectedValue(err);
        await expect(svc.create(uid, { title: "t" })).rejects.toBe(err);
        await expect(svc.findById(id, uid)).rejects.toBe(err);
        await expect(svc.updateById(id, uid, { title: "t" })).rejects.toBe(err);
        await expect(svc.deleteById(id, uid)).rejects.toBe(err);
    });
});
