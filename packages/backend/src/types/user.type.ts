import { ObjectId } from "mongodb";

export interface UserDocument {
    _id?: ObjectId;
    userCred: ObjectId;
    name: string;
    totalAmount: number;
    totalAllotment: number;
}