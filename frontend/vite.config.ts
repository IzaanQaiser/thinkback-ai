import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

// Generate a unique build ID for cache busting
const buildId = `${packageJson.version}-${Date.now()}`;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
    'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId),
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
        assetFileNames: `assets/[name]-[hash]-${buildId}[extname]`,
        chunkFileNames: `assets/[name]-[hash]-${buildId}.js`,
        entryFileNames: `assets/[name]-[hash]-${buildId}.js`,
      },
    },
    assetsDir: 'assets',
  },
});
