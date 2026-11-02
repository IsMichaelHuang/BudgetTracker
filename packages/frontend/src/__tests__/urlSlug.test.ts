import { describe, it, expect } from "vitest";
import { userSlug, categorySlug } from "../hooks/useSlugtify";

describe("userSlug", () => {
    it("slugifies a Latin name", () => {
        expect(userSlug("Alice Smith")).toBe("alice-smith");
    });

    it.each(["李雷", "---", "Net Worth", "net-worth"])(
        "falls back to user for %s",
        (name) => expect(userSlug(name)).toBe("user"),
    );
});

describe("categorySlug", () => {
    it("replaces separators", () => {
        expect(categorySlug("Rent/Utilities")).toBe("rent-utilities");
        expect(categorySlug("Kids #1")).toBe("kids-1");
    });

    it.each(["李雷", ".."])("falls back to category for %s", (t) =>
        expect(categorySlug(t)).toBe("category"),
    );
});
