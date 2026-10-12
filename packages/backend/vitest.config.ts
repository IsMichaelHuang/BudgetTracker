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
        include: ["src/__tests__/**/*.test.ts"],
        env: {
            JWT_SECRET: "test-jwt-secret-that-is-long-enough-0123456789",
            PG_HOST: "localhost",
            PG_PORT: "5432",
            PG_USER: "postgres",
            PG_PASSWORD: "postgres",
            PG_DATABASE: "budget_tracker_test",
            STATIC_DIR: "/tmp",
        },
    },
});
