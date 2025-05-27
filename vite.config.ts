import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Set base URL - only use VITE_BASE_URL if it's explicitly set
  const base = mode === 'production' ? '/' : (env.VITE_BASE_URL || '/');
  
  // Log the base URL for debugging
  console.log(`Running in ${mode} mode with base URL: ${base}`);
  
  return {
    base,
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean) as any[],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Ensure assets are properly referenced in production
    build: {
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            vendor: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          },
        },
      },
      // Ensure assets are properly hashed for cache busting
      assetsDir: 'assets',
      emptyOutDir: true,
    },
  };
});
