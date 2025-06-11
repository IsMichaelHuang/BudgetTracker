import type { UserType } from "./userType";
import type { CategoryType } from "./categoryType";
import type { ChargeType } from "./chargeType";

export interface SummaryType {
    user: UserType;
    categories: CategoryType[];
    charges: ChargeType[];
}


