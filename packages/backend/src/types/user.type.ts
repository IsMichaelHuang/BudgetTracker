import { ObjectId } from "mongodb";

export interface UserDocument {
    _id: ObjectId;
    name: string;
    tAmount: number;
    tAllotment: number;
}