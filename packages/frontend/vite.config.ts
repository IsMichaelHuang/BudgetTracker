import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import checker from "vite-plugin-checker";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), checker({ typescript: true })],
    server: {
        proxy: {
            "/api/": {
                target: "http://localhost:3000",
                changeOrigin: true
            },
            "/auth/": {
                target: "http://localhost:3000",
                changeOrigin: true
            } 
        }
    }
});
