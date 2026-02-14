import { Pool } from "pg";
import { BaseService } from "./base.service";
import type { CategoryDocument } from "types/category.type";

export class CategoryService extends BaseService<CategoryDocument> {
    constructor(pool: Pool) {
        super(pool, "categories");
    }

    async updateCategory(body: CategoryDocument): Promise<boolean> {
        const { _id, userId, ...fieldsToUpdate } = body;
        if (!_id) throw new Error("No _id provided for update");
        return this.updateById(_id, fieldsToUpdate);
    }

    async createCategory(body: CategoryDocument): Promise<boolean> {
        const { _id, ...doc } = body;
        return this.create(doc);
    }

    async deleteCategory(id: string): Promise<boolean> {
        // ON DELETE CASCADE handles charge deletion automatically
        return this.deleteById(id);
    }
}
