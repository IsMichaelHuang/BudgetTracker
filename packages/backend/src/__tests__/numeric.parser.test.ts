import { describe, it, expect } from "vitest";
import { types } from "pg";
import "../postgres.database";

describe("NUMERIC type parser", () => {
    const parse = types.getTypeParser(types.builtins.NUMERIC, "text");

    it("parses NUMERIC text into a number", () => {
        expect(parse("12.34")).toBe(12.34);
        expect(parse("0.30")).toBe(0.3);
        expect(parse("9999999999.99")).toBe(9999999999.99);
    });
});
