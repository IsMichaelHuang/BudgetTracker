import type { CategoryType } from "../types/categoryType";
import type { ChargeType } from "../types/chargeType";
import type { SummaryType } from "../types/summaryType";

export function summaryWith(
    categories: CategoryType[],
    charges: ChargeType[],
    name = "Alice",
): SummaryType {
    return {
        user: {
            _id: "u1",
            userCreds: "c1",
            name,
            totalAmount: 0,
            totalAllotment: 0,
        },
        categories,
        charges,
    };
}
