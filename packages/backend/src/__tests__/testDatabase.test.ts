import { resolveTestDatabaseUrl } from "../__integration__/testDatabase";

const u = (v?: string) => resolveTestDatabaseUrl({ TEST_DATABASE_URL: v });

describe("resolveTestDatabaseUrl", () => {
    it.each([undefined, ""])("returns undefined for %j", (v) => {
        expect(u(v)).toBeUndefined();
    });

    it.each([
        "postgres://u:p@localhost:5432/budget_test",
        "postgresql://u:p@db.ci:5432/x_test?sslmode=require",
    ])("accepts %s", (url) => {
        expect(u(url)).toBe(url);
    });

    it.each([
        "postgres://u:p@localhost:5432/budget_prod",
        "postgres://u:p@localhost:5432/budget_test_backup",
        "postgres://u:p@localhost:5432/test",
        "postgres://u:p@localhost:5432",
        "socket:/tmp/x_test?db=prod",
        "postgres://u:p@h/x_test?database=prod",
        "postgres://u:p@h/x_test?host=prod.example",
    ])("rejects %s", (url) => {
        expect(() => u(url)).toThrow();
    });

    it.each(["postgres://u:s3cret@h/prod", "not a url s3cret"])(
        "never leaks the input in the error for %s",
        (url) => {
            let err: unknown;
            try {
                u(url);
            } catch (e) {
                err = e;
            }
            expect(err).toBeInstanceOf(Error);
            const e = err as Error;
            expect(e.message).not.toContain("s3cret");
            for (const k of Object.getOwnPropertyNames(e)) {
                expect(String((e as never)[k])).not.toContain("s3cret");
            }
        }
    );
});
