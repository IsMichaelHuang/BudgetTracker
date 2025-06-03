import { ObjectId } from "mongodb";

export interface CategoryDocument {
    _id?: ObjectId;
    userId: ObjectId;
    title: string;
    amount: number;
    allotment: number;
}

