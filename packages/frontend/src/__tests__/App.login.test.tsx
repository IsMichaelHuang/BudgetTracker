import { describe, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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

describe("App login redirect", () => {
    beforeEach(() => {
        localStorage.setItem("token", "t");
        // jsdom lacks matchMedia, which DarkModeToggle calls
        vi.stubGlobal("matchMedia", () => ({ matches: false }));
    });

    it.each(["Alice", "李雷", "---", "Net Worth"])(
        "lands on the dashboard for %s",
        async (name) => {
            vi.mocked(useSummary).mockReturnValue({
                summary: summaryWith([], [], name),
                loading: false,
                error: null,
                refetch: vi.fn(),
            });
            render(
                <MemoryRouter initialEntries={["/"]}>
                    <App />
                </MemoryRouter>,
            );
            await screen.findByText("Total Spent");
        },
    );
});
