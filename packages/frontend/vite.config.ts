import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import checker from "vite-plugin-checker";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), checker({ typescript: true })],
    server: {
        host: true,    // listen on 0.0.0.0, not just localhost
        port: 3000,    // change from the default 5173 → 3000
    }
});
