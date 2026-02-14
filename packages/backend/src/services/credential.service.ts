/**
 * @module credential.service
 * @description Handles user registration, password verification, and credential-to-user mapping.
 * Uses bcrypt for password hashing and JWT for authentication token generation.
 */

import { Collection, MongoClient, ObjectId } from "mongodb";
import type { UserDocument } from "types/user.type";
import type { CredentialDocument } from "types/credential.type";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


/** Budget-related fields supplied during user registration. */
interface UserDataProp {
    totalAmount: number;
    totalAllotment: number;
}

/**
 * Creates a signed JWT containing the user's credential ID and username.
 * @param id - Credential document ID (string form of ObjectId).
 * @param username - The authenticated user's username.
 * @param jwtSecret - Secret key used to sign the token.
 * @returns A promise resolving to the signed JWT string (expires in 2 hours).
 */
function generateAuthToken(
    id: string,
    username: string,
    jwtSecret: string
): Promise<string> {
    return new Promise((resolve, reject) => {
        const payload = {id, username};

        jwt.sign(
            payload,
            jwtSecret,
            {expiresIn: "2h"},
            (err, token) => {
                if (err || !token) {
                    reject(err ?? new Error("Failed to sign token"));
                } else {
                    resolve(token);
                }
            }
        );
    });
}

/**
 * Service responsible for user authentication workflows: registration, login, and ID lookup.
 * Operates on both the `users` and `user_credentials` collections.
 */
export class CredentialService {
    private readonly usersCollection: Collection<UserDocument>;
    private readonly credentialsCollection: Collection<CredentialDocument>;

    /**
     * @param mongoClient - Connected MongoClient instance.
     * @throws {Error} If required collection name environment variables are missing.
     */
    constructor(private readonly mongoClient: MongoClient) {
        const collectionUsersName = process.env.USERS_COLLECTION_NAME;
        const collectionCredsName = process.env.CREDS_COLLECTION_NAME;

        if (!collectionUsersName || !collectionCredsName) {
            throw new Error("Missing one or both collection names in environment variables");
        }

        const db = this.mongoClient.db();
        this.usersCollection = db.collection<UserDocument>(collectionUsersName);
        this.credentialsCollection = db.collection<CredentialDocument>(collectionCredsName);
    }

    /**
     * Registers a new user by creating both a credential and a user document.
     * The password is hashed with bcrypt (salt rounds = 10) before storage.
     *
     * @param username - Desired username (must be unique).
     * @param email - User's email address.
     * @param plainTextPassword - Password in plain text (will be hashed).
     * @param userData - Initial budget figures (totalAmount, totalAllotment).
     * @returns `true` if both documents were created successfully, `false` if the username already exists.
     */
    async registerUser(
        username: string,
        email: string,
        plainTextPassword: string,
        userData: UserDataProp
    ): Promise<boolean> {
        const {totalAmount, totalAllotment} = userData;

        // Check for existing username to prevent duplicates
        const exist = await this.credentialsCollection.findOne({username: username});
        if (exist) {
            return false;
        }

        // Hash password before storage
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(plainTextPassword, salt);

        console.log(username, plainTextPassword);

        // Create credential document
        const credentialResult = await this.credentialsCollection.insertOne({
            username,
            email,
            password: hash
        });

        // Create user profile document linked to the credential
        const userResult = await this.usersCollection.insertOne({
            userCred: credentialResult.insertedId,
            name: username,
            totalAmount,
            totalAllotment
        });

        const result = (
            (credentialResult.insertedId ? true : false) &&
            (userResult.insertedId ? true : false)
        );
        return result;
    }

    /**
     * Verifies a user's password and returns a signed JWT on success.
     *
     * @param username - The username to authenticate.
     * @param plainTextPassword - The plain-text password to verify.
     * @param secret - JWT signing secret from app configuration.
     * @returns An object containing the JWT `token`, or `null` if credentials are invalid.
     */
    async verifyPassword(
        username: string,
        plainTextPassword: string,
        secret: string
    ): Promise<{token: string} | null> {
        const user = await this.credentialsCollection.findOne({username});
        if (!user) return null;

        const match = await bcrypt.compare(plainTextPassword, user.password);
        if (!match) return null;

        const token = await generateAuthToken(user._id.toString(), username, secret);
        return { token };
    }

    /**
     * Maps a credential document ID to the associated user document ID.
     *
     * @param userCredId - String ObjectId of the credential document (from the JWT payload).
     * @returns An object with the resolved `userId`.
     * @throws {Error} If no user document references the given credential ID.
     */
    async getUserId(userCredId: string): Promise<{userId: string}> {
        const id = new ObjectId(userCredId);
        const user = await this.usersCollection.findOne({userCred: id})
        if (!user) throw new Error("Unable to find user from userCred Id");

        return { userId: user._id.toString() };
    }
}
