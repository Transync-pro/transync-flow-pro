import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode
  const env = loadEnv(mode, process.cwd(), '');
  
  // Set base URL - empty for production, use VITE_BASE_URL if set
  const base = mode === 'production' ? '/' : (env.VITE_BASE_URL || '/');
  
  // Log the configuration for debugging
  console.log('Vite Configuration:');
  console.log('- Mode:', mode);
  console.log('- Base URL:', base);
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  
  return {
    base,
    define: {
      'import.meta.env.MODE': JSON.stringify(mode),
      'import.meta.env.BASE_URL': JSON.stringify(base),
    },
    server: {
      host: "::",
      port: 3000,
      open: true,
      fs: {
        strict: true,
      },
    },
    preview: {
      port: 3000,
      open: true,
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
    build: {
      sourcemap: true,
      target: 'esnext',
      modulePreload: {
        polyfill: true,
      },
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            vendor: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          },
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
      assetsDir: 'assets',
      emptyOutDir: true,
      outDir: 'dist',
      minify: mode === 'production' ? 'esbuild' : false,
    },
  };
});
