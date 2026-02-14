/**
 * @module index
 * @description Application entry point. Loads environment variables via dotenv,
 * establishes the MongoDB connection, and starts the Express HTTP server.
 *
 * Startup sequence:
 * 1. `dotenv.config()` reads `.env` into `process.env`.
 * 2. {@link connectMongo} opens the MongoDB Atlas connection.
 * 3. `app.listen()` binds to the configured PORT (default 3000).
 *
 * If either the database connection or server startup fails, the process
 * exits with code 1 to signal failure to the orchestrator.
 */

import dotenv from "dotenv";
const result = dotenv.config();
console.log("Result: ", result);


import { connectMongo } from "./mongo.database";
import app from "./app";

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        await connectMongo();
        console.log("MongoDB connected");
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.log("Failed to start app:", err);
        process.exit(1);
    }
}
start().catch(err => {
    console.error("Failed to Start app:", err);
    process.exit(1);
})
