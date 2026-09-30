import { Pool } from "pg";
import { BaseService } from "./base.service";
import type { CategoryDocument } from "types/category.type";
import type { CategoryCreate } from "../validation/category.schema";

type Field = keyof Omit<CategoryCreate, "_id" | "userId">;

/** The only fields (and columns) a category write may touch. */
export const CATEGORY_COLUMNS: Record<Field, string> = {
    title: "title",
    allotment: "allotment",
};

export class CategoryService extends BaseService<CategoryDocument, Field> {
    constructor(pool: Pool) {
        super(pool, "categories", CATEGORY_COLUMNS);
    }

    async updateCategory(
        id: string,
        userId: string,
        fields: Partial<Record<Field, unknown>>
    ): Promise<boolean> {
        return this.updateById(id, userId, fields);
    }

    async createCategory(
        userId: string,
        doc: Partial<Record<Field, unknown>>
    ): Promise<boolean> {
        return this.create(userId, doc);
    }

    async deleteCategory(id: string, userId: string): Promise<boolean> {
        // ON DELETE CASCADE handles charge deletion automatically
        return this.deleteById(id, userId);
    }
}
