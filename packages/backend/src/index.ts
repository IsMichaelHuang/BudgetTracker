import dotenv from "dotenv";
const result = dotenv.config();
console.log("Result: ", result);

import { connectPostgres, closePostgres } from "./postgres.database";
import app from "./app";

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        await connectPostgres();
        console.log("PostgreSQL connected");
        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

        // Graceful shutdown
        const shutdown = async () => {
            console.log("Shutting down...");
            server.close();
            await closePostgres();
            process.exit(0);
        };
        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
    } catch (err) {
        console.log("Failed to start app:", err);
        process.exit(1);
    }
}
start().catch(err => {
    console.error("Failed to Start app:", err);
    process.exit(1);
});
