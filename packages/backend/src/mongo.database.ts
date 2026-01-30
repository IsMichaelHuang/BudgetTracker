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

/*
DEBUG
console.log("ENV DEBUG:", {
  user: process.env.MONGO_USER,
  cluster: process.env.MONGO_CLUSTER,
  db: process.env.DB_NAME,
});
*/


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


const url = `mongodb+srv://${userEnc}:${pwdEnc}@${clusterEnc}/${dbEnc}?appName=BudgetTrackerDB`

// Instantiate *once*
export const mongoClient = new MongoClient(url);

// Connects the client and return DB instance
let _db: Db | null = null;
export async function connectMongo(): Promise<Db> {
    if (!_db) {
        await mongoClient.connect();
        console.log("MongoDB connected to database");
        _db = mongoClient.db(DB_NAME);
    }
    return _db;
}

