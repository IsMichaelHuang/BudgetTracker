/**
 * @module mongo.database
 * @description MongoDB Atlas connection module. Builds the connection URI from
 * environment variables, instantiates a singleton {@link MongoClient}, and exposes
 * a lazy-connect helper that caches the {@link Db} instance.
 *
 * Required environment variables:
 * - `MONGO_USER` - Atlas database user
 * - `MONGO_PWD` - Atlas database password
 * - `MONGO_CLUSTER` - Atlas cluster hostname (e.g. `cluster0.abc123.mongodb.net`)
 * - `DB_NAME` - Target database name
 *
 * @throws {Error} At module load time if any required env var is missing.
 */

import { MongoClient, Db } from "mongodb";


const {
    MONGO_USER,
    MONGO_PWD,
    MONGO_CLUSTER,
    DB_NAME
} = process.env;

const requiredEnvs: [string, string | undefined][] = [
    ["MONGO_USER", MONGO_USER],
    ["MONGO_PWD", MONGO_PWD],
    ["MONGO_CLUSTER", MONGO_CLUSTER],
    ["DB_NAME", DB_NAME],
];

console.log("ENV DEBUG:", {
  user: process.env.MONGO_USER,
  cluster: process.env.MONGO_CLUSTER,
  db: process.env.DB_NAME,
});

// Filter out the ones that are missing
const missing = requiredEnvs.filter(([_, value]) => !value).map(([key]) => key);

if(missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(", ")}`)
}
console.log("ALL required ENV vars are set!");

// URL-encoding all the .env vars
const userEnc = encodeURIComponent(MONGO_USER!);
const pwdEnc = encodeURIComponent(MONGO_PWD!);
const clusterEnc = encodeURIComponent(MONGO_CLUSTER!);
const dbEnc = encodeURIComponent(DB_NAME!);


const url = `mongodb+srv://${MONGO_USER}:${MONGO_PWD}@${MONGO_CLUSTER}/${DB_NAME}?appName=BudgetTrackerDB`

/** Singleton MongoClient instance shared across all services. */
export const mongoClient = new MongoClient(url);

/**
 * Lazily connects the {@link mongoClient} and returns the default {@link Db} instance.
 * Subsequent calls return the cached connection without reconnecting.
 *
 * @returns The connected MongoDB database instance.
 * @throws {Error} If the connection to MongoDB Atlas fails.
 */
let _db: Db | null = null;
export async function connectMongo(): Promise<Db> {
    if (!_db) {
        await mongoClient.connect();
        console.log("MongoDB connected to database");
        _db = mongoClient.db(DB_NAME);
    }
    return _db;
}
