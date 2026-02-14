import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    resolve: {
        alias: {
            types: path.resolve(__dirname, "src/types"),
        },
    },
    test: {
        globals: true,
        environment: "node",
        env: {
            JWT_SECRET: "test-jwt-secret",
            USERS_COLLECTION_NAME: "users",
            CREDS_COLLECTION_NAME: "user_credentials",
            CHARGES_COLLECTION_NAME: "charges",
            CATEGORIES_COLLECTION_NAME: "categories",
            NETWORTH_COLLECTION_NAME: "networth",
            STATIC_DIR: "/tmp",
        },
    },
});
