/**
 * @module credentialType
 * @description Client-side type definition for a user credential record.
 * Used primarily for type-checking API responses from the auth endpoints.
 */

/** Represents a user credential document as received from the API. */
export interface CredentialType {
    /** MongoDB ObjectId string of the credential document. */
    _id: string,
    /** Unique username used for authentication. */
    username: string,
    /** User's email address. */
    email: string,
    /** Hashed password (only present in server-side contexts; never sent to the client). */
    password: string
}
