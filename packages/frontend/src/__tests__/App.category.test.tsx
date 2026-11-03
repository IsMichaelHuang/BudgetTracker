import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import useSummary from "../hooks/useSummary";
import { summaryWith } from "./helpers";

vi.mock("../hooks/useSummary");
vi.mock("../api/credentials", () => ({
    getUserId: () => Promise.resolve("u1"),
}));
vi.mock("../api/auth", () => ({
    getAuthHeaders: () => ({}),
    authFetch: vi.fn(),
}));

function showApp(title: string, path: string) {
    const category = {
        _id: "c9",
        userId: "u1",
        title,
        amount: 0,
        allotment: 0,
    };
    vi.mocked(useSummary).mockReturnValue({
        summary: summaryWith([category], []),
        loading: false,
        error: null,
        refetch: vi.fn(),
    });
    render(
        <MemoryRouter initialEntries={[path]}>
            <App />
        </MemoryRouter>,
    );
}

describe("App category routes", () => {
    beforeEach(() => {
        localStorage.setItem("token", "t");
        // jsdom lacks matchMedia, which DarkModeToggle calls
        vi.stubGlobal("matchMedia", () => ({ matches: false }));
    });

    it.each([
        "Rent/Utilities",
        "Kids #1",
        "Q&A?",
        "李雷",
        "..",
        "100%",
        "new",
        "category",
    ])("opens %s and preselects it in the charge form", async (title) => {
        showApp(title, "/al/u1");
        fireEvent.click(await screen.findByText(title));
        expect(
            await screen.findByRole("heading", { name: title }),
        ).toBeTruthy();
        fireEvent.click(screen.getByText("+ Add New Charge"));
        const select = (await screen.findByRole(
            "combobox",
        )) as HTMLSelectElement;
        expect(select.value).toBe("c9");
    });

    it("shows the current title when the URL slug is stale", async () => {
        showApp("Rent2", "/al/u1/Rent/c9");
        expect(
            await screen.findByRole("heading", { name: "Rent2" }),
        ).toBeTruthy();
    });
});
