import dotenv from "dotenv";
dotenv.config();


import { connectMongo } from "./mongo.database";
import "./app";


async function start() { 
    try {
        await connectMongo();
        console.log("MongoDB connected");
    } catch (err) {
        console.log("Failed to start app:", err);
        process.exit(1);
    }
}
start().catch(err => {
    console.error("Failed to Start app:", err);
    process.exit(1);
})

