import { ObjectId } from "mongodb";


export interface CredentialDocument {
    _id?: ObjectId;
    username: string;
    email: string;
    password: string
}

