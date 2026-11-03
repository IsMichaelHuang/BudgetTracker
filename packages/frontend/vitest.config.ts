import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
    plugins: [react()],
    // Vite picks react-router's CJS build, node picks its ESM build for
    // react-router-dom; two copies mean useParams reads an empty context
    resolve: {
        alias: [
            {
                find: /^react-router$/,
                replacement: fileURLToPath(
                    import.meta.resolve("react-router"),
                ),
            },
        ],
    },
    test: {
        environment: "jsdom",
        globals: true,
        // Node built-in webstorage shadows jsdom localStorage
        execArgv: ["--no-experimental-webstorage"],
        include: ["src/__tests__/**/*.test.{ts,tsx}"],
    },
});
