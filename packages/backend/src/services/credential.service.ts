import { Collection, MongoClient, ObjectId } from "mongodb";
import type { UserDocument } from "types/user.type";
import type { CredentialDocument } from "types/credential.type";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


interface UserDataProp {
    totalAmount: number;
    totalAllotment: number;
}

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

export class CredentialService {
    private readonly usersCollection: Collection<UserDocument>;
    private readonly credentialsCollection: Collection<CredentialDocument>; 

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

    async registerUser(
        username: string,
        email: string, 
        plainTextPassword: string,
        userData: UserDataProp
    ): Promise<boolean> {
        const {totalAmount, totalAllotment} = userData;
        const exist = await this.credentialsCollection.findOne({username: username});
        if (exist) {
            return false;
        }
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(plainTextPassword, salt);

        console.log(username, plainTextPassword);
        const credentialResult = await this.credentialsCollection.insertOne({
            username,
            email,
            password: hash
        });
 
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

    async getUserId(userCredId: string): Promise<{userId: string}> {
        const id = new ObjectId(userCredId);
        const user = await this.usersCollection.findOne({userCred: id})
        if (!user) throw new Error("Unable to find user from userCred Id");

        return { userId: user._id.toString() };
    }
}


