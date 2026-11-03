import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ChargeFormPage from "../pages/ChargeFormPage";
import { addCharge, updateCharge } from "../api/charges";
import { summaryWith } from "./helpers";

vi.mock("../api/charges", () => ({
    addCharge: vi.fn(),
    updateCharge: vi.fn(),
    deleteCharge: vi.fn(),
}));

const cat = (_id: string) => ({
    _id,
    userId: "u",
    title: "Food",
    amount: 0,
    allotment: 0,
});
const charge = {
    _id: "c1",
    userId: "u",
    categoryId: "B",
    description: "lunch",
    amount: 5,
    date: "2024-01-02",
};
const summary = summaryWith([cat("A"), cat("B")], [charge]);

function showForm(path: string) {
    const form = <ChargeFormPage summaryData={summary} refetch={vi.fn()} />;
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route
                    path="/:username/:userId/:category/:catId/:chId"
                    element={form}
                />
                <Route
                    path="/:username/:userId/:category/:catId/new"
                    element={form}
                />
            </Routes>
        </MemoryRouter>,
    );
    return screen.getByRole("combobox") as HTMLSelectElement;
}

function fillAndSubmit() {
    fireEvent.change(screen.getByPlaceholderText("0.00"), {
        target: { value: "7" },
    });
    fireEvent.change(screen.getByLabelText("Enter Date:"), {
        target: { value: "2024-03-04" },
    });
    fireEvent.click(screen.getByText("Submit"));
}

describe("ChargeFormPage category by ID", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(window.history, "back").mockImplementation(() => {});
    });

    it("adds to the category in the URL when titles collide", async () => {
        showForm("/al/u/Food/B/new");
        fillAndSubmit();
        await waitFor(() => expect(addCharge).toHaveBeenCalled());
        expect(vi.mocked(addCharge).mock.calls[0][0].categoryId).toBe("B");
    });

    it("keeps the charge's category when editing", async () => {
        showForm("/al/u/Food/B/c1");
        fillAndSubmit();
        await waitFor(() => expect(updateCharge).toHaveBeenCalled());
        expect(vi.mocked(updateCharge).mock.calls[0][0].categoryId).toBe("B");
    });

    it("starts on the charge's category, not the URL's", () => {
        expect(showForm("/al/u/Food/A/c1").value).toBe("B");
    });

    it("moves the charge when another category is chosen", async () => {
        const select = showForm("/al/u/Food/A/c1");
        fireEvent.change(select, { target: { value: "A" } });
        fillAndSubmit();
        await waitFor(() => expect(updateCharge).toHaveBeenCalled());
        expect(vi.mocked(updateCharge).mock.calls[0][0].categoryId).toBe("A");
    });

    it("leaves the select empty for an unknown category ID", () => {
        expect(showForm("/al/u/Food/unknown/new").value).toBe("");
    });
});
