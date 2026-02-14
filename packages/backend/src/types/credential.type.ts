/**
 * @module credential.type
 * @description MongoDB document schema for user authentication credentials.
 * Stores login identity (username, email) and the bcrypt-hashed password.
 */

import { ObjectId } from "mongodb";

/**
 * Represents a credential document in the `user_credentials` collection.
 * Each record maps one-to-one with a {@link UserDocument}.
 */
export interface CredentialDocument {
    /** MongoDB document identifier. Auto-generated on insert if omitted. */
    _id?: ObjectId;
    /** Unique username used for login. */
    username: string;
    /** Email address associated with the account. */
    email: string;
    /** Bcrypt-hashed password. Never stored or transmitted in plain text. */
    password: string
}
