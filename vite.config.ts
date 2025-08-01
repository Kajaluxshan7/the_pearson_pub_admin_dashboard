import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "::",
    port: 3002,
    strictPort: true,
    // allowedHosts: ["swift-supply.xyz"],
  },
});
