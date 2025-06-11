import type { UserDocument } from "./user.type";
import type { CategoryDocument } from "./category.type";
import type { ChargeDocument } from "./charge.type";

export interface SummaryDocument {
    user: UserDocument;
    categories: CategoryDocument[];
    charges: ChargeDocument[];
}

