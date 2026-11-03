import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        // Node built-in webstorage shadows jsdom localStorage
        execArgv: ["--no-experimental-webstorage"],
        include: ["src/__tests__/**/*.test.{ts,tsx}"],
    },
});
