import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Base is set to root for all environments since we're using subdomains
  base: '/',
  server: {
    host: "::",
    port: 8080,
    // Enable CORS for all origins in development
    cors: true,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Ensure build outputs are relative to the base
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: mode === 'development',
  },
  // Configure environment variables
  define: {
    'import.meta.env.BASE_URL': JSON.stringify('/'),
  },
}));
