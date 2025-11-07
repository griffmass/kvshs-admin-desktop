import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  
    envPrefix: 'VITE_', // This is the default, but it's good to be explicit
    base: './', // Use relative paths for the build
    plugins: [react()],
    server: {
      hmr: false,
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        }
      }
    },
    css: {
      devSourcemap: false,
    },
});