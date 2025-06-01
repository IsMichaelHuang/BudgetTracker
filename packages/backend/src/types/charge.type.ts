import { ObjectId } from "mongodb";


export interface ChargeDocument {
    _id: ObjectId;
    userId: ObjectId;
    categoryId: ObjectId;
    description: string;
    amount: number;
    data: Date;
}

