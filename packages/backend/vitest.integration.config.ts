import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Integration tests: real Postgres, no pg mock.
 * Uses TEST_DATABASE_URL when set; otherwise globalSetup starts an
 * embedded Postgres on port 54330 (no Docker needed).
 */
export const EMBEDDED_URL =
    "postgres://bt_test:bt_test@localhost:54330/budget_test";

export default defineConfig({
    resolve: {
        alias: {
            types: path.resolve(__dirname, "src/types"),
        },
    },
    test: {
        globals: true,
        environment: "node",
        include: ["src/__integration__/**/*.test.ts"],
        globalSetup: ["src/__integration__/globalSetup.ts"],
        fileParallelism: false,
        hookTimeout: 60_000,
        env: {
            JWT_SECRET: "test-jwt-secret-that-is-long-enough-0123456789",
            DATABASE_URL: process.env.TEST_DATABASE_URL ?? EMBEDDED_URL,
            STATIC_DIR: "/tmp",
        },
    },
});
